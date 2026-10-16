const fs = require('fs');
const path = require('path');

const { computeCommittedAndDonePoints, computePointsVersusTime, parseDate } = require('./points-versus-time');
const {
  buildBlockedList,
  buildOverdueList,
  buildUnassignedList,
  buildOverloadedList,
} = require('./attention-lists');
const { getGoalStatus } = require('./goal-status');

const SAMPLE_SPRINT_PATH = path.resolve(__dirname, '..', '..', 'sample', 'sprint.json');

function getSprintHealthStub() {
  return {
    pageState: 'ready',
    source: 'sample',
    goalStatus: {
      status: 'on_track',
      label: 'On track',
    },
    attention: getEmptyAttention(),
  };
}

function formatAsOfDate(date, timeZone = process.env.TZ || 'UTC') {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const values = {};

  for (const part of parts) {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  }

  return `${values.year}-${values.month}-${values.day}`;
}

function getEmptyAttention() {
  return {
    blocked: { count: 0, rows: [] },
    overdue: { count: 0, rows: [] },
    unassigned: { count: 0, rows: [] },
    overloaded: { count: 0, rows: [], median: null, threshold: null },
  };
}

function loadSampleSprint(sprintPath = SAMPLE_SPRINT_PATH) {
  const raw = fs.readFileSync(sprintPath, 'utf8');
  const sprint = JSON.parse(raw);

  if (!sprint || typeof sprint !== 'object' || Array.isArray(sprint)) {
    throw new Error('Sample sprint JSON must be an object');
  }

  return sprint;
}

function listPayload(name, rows, extra = {}) {
  return { name, count: rows.length, rows, ...extra };
}

function getSampleAttention(issues, today) {
  const overloaded = buildOverloadedList(issues);

  return {
    blocked: listPayload('blocked', buildBlockedList(issues)),
    overdue: listPayload('overdue', buildOverdueList(issues, today)),
    unassigned: listPayload('unassigned', buildUnassignedList(issues)),
    overloaded: listPayload('overloaded', overloaded.rows, {
      median: overloaded.median,
      medianDisplay: overloaded.medianDisplay,
      threshold: overloaded.threshold,
      thresholdDisplay: overloaded.thresholdDisplay,
    }),
  };
}

function getSprintHealthSample({ today, sprintPath = SAMPLE_SPRINT_PATH } = {}) {
  const sprint = loadSampleSprint(sprintPath);
  const asOfDate = today instanceof Date
    ? formatAsOfDate(today, process.env.TZ || 'UTC')
    : typeof today === 'string'
      ? today.trim()
      : formatAsOfDate(new Date(), process.env.TZ || 'UTC');

  const startDate = sprint.startDate ?? sprint.start ?? null;
  const endDate = sprint.endDate ?? sprint.end ?? null;
  const goalText = typeof sprint.goal === 'string'
    ? sprint.goal.trim() || null
    : typeof sprint.goalText === 'string'
      ? sprint.goalText.trim() || null
      : null;

  const issues = Array.isArray(sprint.issues) ? sprint.issues : [];
  const totals = computeCommittedAndDonePoints(issues);
  const pointsSummary = computePointsVersusTime({
    start: startDate,
    end: endDate,
    today: asOfDate,
    completedPercent: totals.completedPercent,
    issues,
  });

  const hasValidDates = parseDate(startDate) && parseDate(endDate);

  return {
    pageState: hasValidDates ? 'ready' : 'dates_unavailable',
    source: 'sample',
    asOfDate,
    sprint: {
      name: sprint.name ?? null,
      startDate: startDate ?? null,
      endDate: endDate ?? null,
      goalText,
      url: null,
    },
    pointsVersusTime: {
      label: pointsSummary.label,
      completedPercent: pointsSummary.completedDisplay,
      elapsedPercent: pointsSummary.elapsedDisplay,
      gap: pointsSummary.gap,
      gapDisplay: pointsSummary.gapDisplay,
      committedPoints: pointsSummary.committedPoints,
      donePoints: pointsSummary.donePoints,
    },
    goalStatus: getGoalStatus(),
    attention: getSampleAttention(issues, asOfDate),
  };
}

module.exports = {
  getSprintHealthStub,
  loadSampleSprint,
  getSprintHealthSample,
  formatAsOfDate,
  getEmptyAttention,
  getSampleAttention,
};
