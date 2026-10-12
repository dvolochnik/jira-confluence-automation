const COUNTED_TYPES = new Set(['story', 'bug', 'task']);
const EXCLUDED_TYPES = new Set(['sub-task', 'subtask', 'user story', 'epic']);

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function isCountedIssue(issue = {}) {
  const typeName = normalizeText(issue.type ?? issue.issuetype ?? issue.category);

  if (!typeName) {
    return false;
  }

  if (COUNTED_TYPES.has(typeName)) {
    return true;
  }

  if (EXCLUDED_TYPES.has(typeName)) {
    return false;
  }

  return false;
}

function isDoneIssue(issue = {}) {
  const category = normalizeText(
    issue.statusCategory ?? issue.status_category ?? issue.category ?? issue.statusCat,
  );
  const statusName = normalizeText(issue.status ?? issue.statusName ?? issue.status_name ?? issue.state);

  if (category) {
    return category === 'done';
  }

  return statusName === 'done';
}

module.exports = {
  isCountedIssue,
  isEligibleIssue: isCountedIssue,
  isDoneIssue,
  isDoneStatus: isDoneIssue,
  COUNTED_TYPES,
  EXCLUDED_TYPES,
};
