const { isCountedIssue, isDoneIssue } = require('./eligibility');

function sortKeys(list = []) {
  return [...list]
    .filter((value) => typeof value === 'string' || typeof value === 'number')
    .map((value) => String(value).trim())
    .filter(Boolean)
    .sort((left, right) => {
      if (left < right) return -1;
      if (left > right) return 1;
      return 0;
    });
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

    rows.push({
      key: issue.key,
      summary: issue.summary ?? '',
      assignee: issue.assignee && typeof issue.assignee === 'object' && issue.assignee.displayName
        ? issue.assignee.displayName
        : issue.assignee ?? null,
      storyPoints: issue.storyPoints ?? issue.points ?? null,
      signals,
    });
  }

  rows.sort((left, right) => {
    if ((left.key ?? '') < (right.key ?? '')) return -1;
    if ((left.key ?? '') > (right.key ?? '')) return 1;
    return 0;
  });

  return rows;
}

module.exports = {
  buildBlockedList,
  sortKeys,
};
