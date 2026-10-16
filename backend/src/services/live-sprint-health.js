const {
  computeCommittedAndDonePoints,
  computePointsVersusTime,
  parseDate,
} = require('./points-versus-time');
const {
  buildBlockedList,
  buildOverdueList,
  buildUnassignedList,
  buildOverloadedList,
} = require('./attention-lists');
const { getGoalStatus } = require('./goal-status');
const { createJiraClient, JiraHttpError } = require('../clients/jira-client');

const CONFIG_KEYS = ['JIRA_SITE_URL', 'JIRA_BOARD_ID', 'JIRA_EMAIL', 'JIRA_API_TOKEN'];

function isValidSiteUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  let normalized = value.trim();
  if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
  if (normalized.endsWith('/')) return false;
  try {
    const url = new URL(normalized);
    return url.protocol === 'https:'
      && !url.username
      && !url.password
      && !url.search
      && !url.hash
      && url.pathname === '/'
      && normalized === url.origin;
  } catch {
    return false;
  }
}

function getMissingLiveVariable(config) {
  for (const key of CONFIG_KEYS) {
    const value = config[key];
    if (typeof value !== 'string' || !value.trim()) return key;
    if (key === 'JIRA_SITE_URL' && !isValidSiteUrl(value)) return key;
    if (key === 'JIRA_BOARD_ID' && !/^[1-9]\d*$/.test(value)) return key;
  }
  return null;
}

function errorPayload(pageState, code, message, goalStatus, today, extra = {}) {
  return {
    pageState,
    source: 'live',
    asOfDate: today,
    sprint: null,
    pointsVersusTime: null,
    attention: null,
    goalStatus,
    error: { code, message, ...extra },
  };
}

function makeAttention(issues, today) {
  const blocked = buildBlockedList(issues);
  const overdue = buildOverdueList(issues, today);
  const unassigned = buildUnassignedList(issues);
  const overloaded = buildOverloadedList(issues);
  return {
    blocked: { count: blocked.length, rows: blocked },
    overdue: { count: overdue.length, rows: overdue },
    unassigned: { count: unassigned.length, rows: unassigned },
    overloaded: {
      count: overloaded.rows.length,
      rows: overloaded.rows,
      median: overloaded.median,
      threshold: overloaded.threshold,
      medianDisplay: overloaded.medianDisplay,
      thresholdDisplay: overloaded.thresholdDisplay,
    },
  };
}

async function getLiveSprintHealth({
  config,
  today,
  client,
  getGoalStatus: readGoalStatus = getGoalStatus,
  fetchImpl,
} = {}) {
  const goalStatus = readGoalStatus();
  const missingVariable = getMissingLiveVariable(config ?? {});
  if (missingVariable) {
    return errorPayload(
      'missing_config',
      'missing_config',
      `Missing configuration: ${missingVariable}.`,
      goalStatus,
      today,
      { missingVariable, httpStatus: null },
    );
  }

  try {
    const jira = client ?? createJiraClient({
      siteUrl: config.JIRA_SITE_URL.trim().replace(/\/$/, ''),
      boardId: config.JIRA_BOARD_ID,
      email: config.JIRA_EMAIL,
      apiToken: config.JIRA_API_TOKEN,
      fetchImpl,
    });
    const sprints = await jira.getActiveSprints();
    if (!Array.isArray(sprints)) throw new Error('Jira returned an unreadable sprint array');
    if (sprints.length === 0) {
      return errorPayload('no_active_sprint', 'no_active_sprint', 'This board has no active sprint.', goalStatus, today);
    }
    if (sprints.length > 1) {
      return errorPayload(
        'multiple_active_sprints',
        'multiple_active_sprints',
        'This board has more than one active sprint.',
        goalStatus,
        today,
      );
    }

    const sprint = await jira.getSprintSnapshot(sprints[0]);
    const issues = sprint.issues;
    if (!Array.isArray(issues)) throw new Error('Jira returned an unreadable issue array');
    const totals = computeCommittedAndDonePoints(issues);
    const points = computePointsVersusTime({
      start: sprint.startDate,
      end: sprint.endDate,
      today,
      completedPercent: totals.completedPercent,
      issues,
    });
    const datesAvailable = Boolean(parseDate(sprint.startDate) && parseDate(sprint.endDate));
    const siteOrigin = new URL(config.JIRA_SITE_URL.trim().replace(/\/$/, '')).origin;
    const attention = makeAttention(issues, today);
    for (const list of Object.values(attention)) {
      for (const row of list.rows) {
        if (row.key) row.url = `${siteOrigin}/browse/${encodeURIComponent(row.key)}`;
      }
    }

    return {
      pageState: datesAvailable ? 'ready' : 'dates_unavailable',
      source: 'live',
      asOfDate: today,
      sprint: {
        name: sprint.name,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        goalText: typeof sprint.goal === 'string' ? sprint.goal.trim() || null : null,
        url: null,
      },
      pointsVersusTime: {
        label: points.label,
        completedPercent: points.completedDisplay,
        elapsedPercent: points.elapsedDisplay,
        gap: points.gap,
        gapDisplay: points.gapDisplay,
        committedPoints: points.committedPoints,
        donePoints: points.donePoints,
      },
      goalStatus,
      attention,
    };
  } catch (error) {
    const httpStatus = error instanceof JiraHttpError ? error.status : null;
    return errorPayload(
      'source_error',
      'source_error',
      'The sprint could not be loaded.',
      goalStatus,
      today,
      { httpStatus },
    );
  }
}

module.exports = {
  CONFIG_KEYS,
  isValidSiteUrl,
  getMissingLiveVariable,
  getLiveSprintHealth,
};
