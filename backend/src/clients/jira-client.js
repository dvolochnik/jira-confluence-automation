const { parseDate } = require('../services/points-versus-time');

class JiraHttpError extends Error {
  constructor(status) {
    super(`Jira returned HTTP ${status}`);
    this.name = 'JiraHttpError';
    this.status = status;
  }
}

function calendarDate(value, timeZone) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const text = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return parseDate(text) ? text : null;
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal')
    .map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function readImpedimentFlag(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.trim().length > 0;
  return value === true || (typeof value === 'number' && value !== 0);
}

function mapIssue(issue, { storyPointFieldId, flaggedFieldId, timeZone }) {
  const fields = issue?.fields ?? {};
  const matchingBlockLinks = Array.isArray(fields.issuelinks)
    ? fields.issuelinks.filter((link) =>
      String(link?.type?.inward ?? '').trim().toLowerCase() === 'is blocked by')
    : [];
  const blockedByKeys = matchingBlockLinks.length
    ? matchingBlockLinks
      .map((link) => link?.inwardIssue?.key)
      .filter((key) => typeof key === 'string' && key.trim())
      .map((key) => key.trim())
    : null;
  const status = fields.status ?? {};
  const rawPoints = storyPointFieldId ? fields[storyPointFieldId] : null;
  const points = typeof rawPoints === 'number' && Number.isFinite(rawPoints)
    ? rawPoints
    : typeof rawPoints === 'string' && rawPoints.trim() && Number.isFinite(Number(rawPoints))
      ? Number(rawPoints)
      : null;
  const mapped = {
    key: issue?.key ?? null,
    summary: typeof fields.summary === 'string' ? fields.summary : '',
    type: fields.issuetype?.name ?? null,
    statusName: status.name ?? null,
    statusCategory: status.statusCategory?.name ?? status.statusCategory?.key ?? null,
    assignee: fields.assignee
      ? {
        accountId: fields.assignee.accountId ?? null,
        displayName: fields.assignee.displayName ?? null,
      }
      : null,
    dueDate: calendarDate(fields.duedate, timeZone),
    parentSet: Boolean(fields.parent),
    flagged: readImpedimentFlag(fields.flagged ?? fields[flaggedFieldId]),
    blockedByKeys,
    points,
  };
  return mapped;
}

function createJiraClient({
  siteUrl,
  boardId,
  email,
  apiToken,
  fetchImpl = globalThis.fetch,
  timeZone = process.env.TZ || 'UTC',
}) {
  if (typeof fetchImpl !== 'function') {
    throw new TypeError('A fetch implementation is required');
  }
  const origin = new URL(siteUrl).origin;
  const authorization = `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`;

  async function getJson(pathname, query = {}) {
    const url = new URL(pathname, `${origin}/`);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
    }
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: authorization,
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new JiraHttpError(response.status);
    return response.json();
  }

  async function getAllSprints() {
    const sprints = [];
    let startAt = 0;
    while (true) {
      const payload = await getJson(`/rest/agile/1.0/board/${encodeURIComponent(boardId)}/sprint`, {
        state: 'active',
        startAt,
        maxResults: 50,
      });
      if (!Array.isArray(payload?.values)) {
        throw new Error('Jira returned an unreadable sprint array');
      }
      sprints.push(...payload.values);
      if (payload.isLast === true || payload.values.length < 50
        || (Number.isFinite(payload.total) && startAt + payload.values.length >= payload.total)) {
        return sprints;
      }
      if (!payload.values.length) throw new Error('Jira returned an incomplete sprint array');
      startAt += payload.values.length;
    }
  }

  async function getIssues(sprintId) {
    const fieldPayload = await getJson('/rest/api/3/field');
    if (!Array.isArray(fieldPayload)) throw new Error('Jira returned an unreadable field array');
    const storyPointField = fieldPayload.find((field) =>
      ['story points', 'story point estimate'].includes(String(field?.name ?? '').trim().toLowerCase()));
    const flaggedField = fieldPayload.find((field) =>
      String(field?.name ?? '').trim().toLowerCase() === 'flagged');
    const fields = [
      'summary', 'issuetype', 'status', 'assignee', 'duedate', 'parent',
      'flagged', 'issuelinks',
    ];
    if (storyPointField?.id) fields.push(storyPointField.id);
    if (flaggedField?.id && !fields.includes(flaggedField.id)) fields.push(flaggedField.id);

    const issues = [];
    let startAt = 0;
    while (true) {
      const payload = await getJson(`/rest/agile/1.0/sprint/${encodeURIComponent(sprintId)}/issue`, {
        startAt,
        maxResults: 50,
        fields: fields.join(','),
      });
      if (!Array.isArray(payload?.issues)) {
        throw new Error('Jira returned an unreadable issue array');
      }
      issues.push(...payload.issues.map((issue) => mapIssue(issue, {
        storyPointFieldId: storyPointField?.id,
        flaggedFieldId: flaggedField?.id,
        timeZone,
      })).filter((issue) => typeof issue.key === 'string' && issue.key.trim()));
      if (payload.isLast === true || payload.issues.length < 50
        || (Number.isFinite(payload.total) && startAt + payload.issues.length >= payload.total)) {
        return issues;
      }
      if (!payload.issues.length) throw new Error('Jira returned an incomplete issue array');
      startAt += payload.issues.length;
    }
  }

  return {
    async getActiveSprints() {
      return getAllSprints();
    },
    async getSprintSnapshot(sprint) {
      const issues = await getIssues(sprint.id);
      return {
        name: sprint.name ?? null,
        startDate: calendarDate(sprint.startDate, timeZone),
        endDate: calendarDate(sprint.endDate, timeZone),
        goal: typeof sprint.goal === 'string' ? sprint.goal : null,
        issues,
      };
    },
  };
}

module.exports = {
  JiraHttpError,
  calendarDate,
  mapIssue,
  createJiraClient,
};
