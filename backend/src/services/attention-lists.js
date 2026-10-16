const { isCountedIssue, isDoneIssue } = require('./eligibility');
const {
  add,
  divide,
  formatHalfUp,
  normalizeDecimal,
  toDecimalStringFromScaled,
} = require('./decimal-amount');
const { normalizeStoryPointValue, parseDate } = require('./points-versus-time');

function sortKeys(list = []) {
  return [...new Set(list
    .filter((value) => typeof value === 'string' || typeof value === 'number')
    .map((value) => String(value).trim())
    .filter(Boolean))]
    .sort((left, right) => {
      if (left < right) return -1;
      if (left > right) return 1;
      return 0;
    });
}

function compareKeys(left, right) {
  const leftKey = String(left ?? '');
  const rightKey = String(right ?? '');

  if (leftKey < rightKey) return -1;
  if (leftKey > rightKey) return 1;
  return 0;
}

function getIssuePoints(issue) {
  return issue.storyPoints ?? issue.points ?? null;
}

function getAssigneeAccountId(issue) {
  const accountId = issue.assigneeAccountId ?? issue.assignee?.accountId ?? issue.assignee?.account_id;
  return accountId === null || accountId === undefined || String(accountId).trim() === ''
    ? null
    : String(accountId).trim();
}

function getAssigneeDisplayName(issue) {
  const assignee = issue.assignee;
  const displayName = issue.assigneeDisplayName
    ?? (assignee && typeof assignee === 'object' ? assignee.displayName : null)
    ?? (typeof assignee === 'string' ? assignee : null);

  return typeof displayName === 'string' ? displayName.trim() : '';
}

function issueRow(issue) {
  return {
    key: issue.key,
    summary: issue.summary ?? '',
    assignee: getAssigneeDisplayName(issue) || 'Unassigned',
    storyPoints: getIssuePoints(issue),
  };
}

function sortIssueRows(rows) {
  return rows.sort((left, right) => compareKeys(left.key, right.key));
}

function buildBlockedList(issues = []) {
  const rows = [];

  for (const issue of issues) {
    if (!isCountedIssue(issue) || isDoneIssue(issue)) {
      continue;
    }

    const signals = [];
    const statusName = String(issue.statusName ?? issue.status ?? '').trim();
    const normalizedStatus = statusName.toLowerCase();

    if (issue.flagged === true) {
      signals.push('Flagged');
    }

    if (normalizedStatus === 'blocked') {
      signals.push('Status: Blocked');
    }

    if (Array.isArray(issue.blockedByKeys)) {
      const keys = sortKeys(issue.blockedByKeys);
      signals.push(keys.length ? `Blocked by ${keys.join(', ')}` : 'Blocked by');
    }

    if (!signals.length) {
      continue;
    }

    rows.push({ ...issueRow(issue), signals });
  }

  return sortIssueRows(rows);
}

function buildOverdueList(issues = [], today) {
  const todayDate = parseDate(today);

  if (!todayDate) {
    throw new TypeError('today must be a valid YYYY-MM-DD date');
  }

  const rows = [];

  for (const issue of issues) {
    if (!isCountedIssue(issue) || isDoneIssue(issue)) {
      continue;
    }

    const dueDate = issue.dueDate;
    const parsedDueDate = parseDate(dueDate);

    if (parsedDueDate && parsedDueDate < todayDate) {
      rows.push({ ...issueRow(issue), dueDate: String(dueDate).trim() });
    }
  }

  return sortIssueRows(rows);
}

function buildUnassignedList(issues = []) {
  const rows = issues
    .filter((issue) => isCountedIssue(issue) && !isDoneIssue(issue))
    .filter((issue) => !getAssigneeAccountId(issue) && !getAssigneeDisplayName(issue))
    .map(issueRow);

  return sortIssueRows(rows);
}

function compareDecimals(left, right) {
  const leftDecimal = normalizeDecimal(left);
  const rightDecimal = normalizeDecimal(right);
  const scale = Math.max(leftDecimal.scale, rightDecimal.scale);
  const leftScaled = leftDecimal.coefficient * (10n ** BigInt(scale - leftDecimal.scale));
  const rightScaled = rightDecimal.coefficient * (10n ** BigInt(scale - rightDecimal.scale));

  if (leftScaled < rightScaled) return -1;
  if (leftScaled > rightScaled) return 1;
  return 0;
}

function formatUnroundedDecimal(value) {
  const decimal = normalizeDecimal(value);

  if (!decimal) {
    return '0';
  }

  return toDecimalStringFromScaled(decimal.coefficient, decimal.scale);
}

function buildOverloadedList(issues = []) {
  const people = new Map();

  for (const issue of issues) {
    if (!isCountedIssue(issue) || isDoneIssue(issue)) {
      continue;
    }

    const accountId = getAssigneeAccountId(issue);

    if (!accountId) {
      continue;
    }

    const points = normalizeStoryPointValue(getIssuePoints(issue));
    const displayName = getAssigneeDisplayName(issue);
    const person = people.get(accountId) ?? {
      assigneeAccountId: accountId,
      assignee: displayName || 'Unassigned',
      displayName: displayName || '',
      openPoints: 0,
    };

    person.openPoints = add(person.openPoints, points);
    if (!person.displayName && displayName) {
      person.displayName = displayName;
      person.assignee = displayName;
    }
    people.set(accountId, person);
  }

  const workload = [...people.values()]
    .filter((person) => compareDecimals(person.openPoints, 0) > 0)
    .sort((left, right) => compareDecimals(left.openPoints, right.openPoints));

  if (!workload.length) {
    return {
      rows: [],
      median: null,
      medianDisplay: null,
      threshold: null,
      thresholdDisplay: null,
    };
  }

  const middle = Math.floor(workload.length / 2);
  const median = workload.length % 2
    ? workload[middle].openPoints
    : divide(add(workload[middle - 1].openPoints, workload[middle].openPoints), 2);
  const threshold = add(median, divide(median, 2));
  const rows = workload
    .filter((person) => compareDecimals(person.openPoints, 5) >= 0
      && compareDecimals(person.openPoints, threshold) > 0)
    .map((person) => ({
      assigneeAccountId: person.assigneeAccountId,
      assignee: person.assignee,
      openPoints: person.openPoints,
      openPointsDisplay: formatUnroundedDecimal(person.openPoints),
      median,
      medianDisplay: formatHalfUp(median, 1),
      threshold,
      thresholdDisplay: formatHalfUp(threshold, 1),
    }))
    .sort((left, right) => {
      const pointsOrder = compareDecimals(right.openPoints, left.openPoints);
      if (pointsOrder) return pointsOrder;
      return left.assignee.localeCompare(right.assignee, 'en', { sensitivity: 'base' });
    });

  return {
    rows,
    median,
    medianDisplay: formatHalfUp(median, 1),
    threshold,
    thresholdDisplay: formatHalfUp(threshold, 1),
  };
}

module.exports = {
  buildBlockedList,
  buildOverdueList,
  buildUnassignedList,
  buildOverloadedList,
  sortKeys,
};
