const { formatHalfUp } = require('./decimal-amount');
const { isCountedIssue, isDoneIssue } = require('./eligibility');

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function parseDate(dateValue) {
  if (dateValue === null || dateValue === undefined || dateValue === '') {
    return null;
  }

  const text = String(dateValue).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return null;
  }

  const [year, month, day] = text.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function calculateElapsedPercent(startInput, endInput, todayInput) {
  const startDate = parseDate(startInput);
  const endDate = parseDate(endInput);
  const todayDate = parseDate(todayInput);

  if (!startDate || !endDate || !todayDate) {
    return null;
  }

  if (startDate > endDate) {
    return null;
  }

  if (todayDate < startDate) {
    return 0;
  }

  if (endDate.getTime() === startDate.getTime()) {
    return todayDate.getTime() >= startDate.getTime() ? 100 : 0;
  }

  if (todayDate >= endDate) {
    return 100;
  }

  const totalDays = (endDate - startDate) / DAY_IN_MS;
  const elapsedDays = (todayDate - startDate) / DAY_IN_MS;

  return (elapsedDays / totalDays) * 100;
}

function normalizeStoryPointValue(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) && value >= 0 ? value : 0;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || ['null', 'none', 'missing', 'nan'].includes(trimmed.toLowerCase())) {
      return 0;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }

  return 0;
}

function computeCommittedAndDonePoints(issues = []) {
  let committedPoints = 0;
  let donePoints = 0;

  for (const issue of issues) {
    if (!isCountedIssue(issue)) {
      continue;
    }

    const points = normalizeStoryPointValue(issue.points ?? issue.storyPoints);
    committedPoints += points;

    if (isDoneIssue(issue)) {
      donePoints += points;
    }
  }

  const completedPercent = committedPoints === 0 ? 100 : (donePoints / committedPoints) * 100;

  return {
    committedPoints,
    donePoints,
    completedPercent,
  };
}

function getBandFromGap(gapValue) {
  if (gapValue === null || Number.isNaN(gapValue)) {
    return null;
  }

  if (gapValue <= 0) {
    return 'On track';
  }

  if (gapValue <= 15) {
    return 'At risk';
  }

  return 'Off track';
}

function formatSignedOneDecimal(value) {
  if (value === null || Number.isNaN(value)) {
    return null;
  }

  const display = formatHalfUp(value, 1);
  if (Number(value) === 0) {
    return '0.0';
  }

  return `${Number(value) > 0 ? '+' : '-'}${Math.abs(Number(value)).toFixed(1)}`;
}

function computePointsVersusTime({
  start,
  end,
  today,
  completedPercent,
  issues = [],
} = {}) {
  const elapsedPercent = calculateElapsedPercent(start, end, today);
  const totalPoints = computeCommittedAndDonePoints(issues);
  const resolvedCompletedPercent = completedPercent ?? totalPoints.completedPercent;

  if (elapsedPercent === null || resolvedCompletedPercent === null || Number.isNaN(resolvedCompletedPercent)) {
    return {
      elapsedPercent: null,
      elapsedDisplay: null,
      completedPercent: null,
      completedDisplay: null,
      gap: null,
      gapDisplay: null,
      label: null,
      committedPoints: totalPoints.committedPoints,
      donePoints: totalPoints.donePoints,
    };
  }

  const gap = elapsedPercent - resolvedCompletedPercent;
  const label = getBandFromGap(gap);

  return {
    elapsedPercent,
    elapsedDisplay: formatHalfUp(elapsedPercent, 1),
    completedPercent: resolvedCompletedPercent,
    completedDisplay: formatHalfUp(resolvedCompletedPercent, 1),
    gap,
    gapDisplay: formatSignedOneDecimal(gap),
    label,
    committedPoints: totalPoints.committedPoints,
    donePoints: totalPoints.donePoints,
  };
}

module.exports = {
  parseDate,
  calculateElapsedPercent,
  normalizeStoryPointValue,
  computeCommittedAndDonePoints,
  getBandFromGap,
  formatSignedOneDecimal,
  computePointsVersusTime,
};
