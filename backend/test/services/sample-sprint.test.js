const test = require('node:test');
const assert = require('node:assert/strict');

const sprint = require('../../sample/sprint.json');
const { computeCommittedAndDonePoints } = require('../../src/services/points-versus-time.js');
const { getSprintHealthSample } = require('../../src/services/sprint-health.js');

test('the default sample sprint matches the planned totals', () => {
  const totals = computeCommittedAndDonePoints(sprint.issues);

  assert.equal(sprint.name, 'Sample Sprint');
  assert.equal(sprint.goal, 'Ship the health page.');
  assert.equal(sprint.startDate, '2026-10-01');
  assert.equal(sprint.endDate, '2026-10-15');
  assert.equal(totals.committedPoints, 18);
  assert.equal(totals.donePoints, 2);
  assert.equal(totals.completedPercent, 11.11111111111111);
});

test('SAM-3 stays in the committed and done totals even though it is done', () => {
  const issue = sprint.issues.find((entry) => entry.key === 'SAM-3');
  assert.equal(issue.type, 'Task');
  assert.equal(issue.statusCategory, 'Done');
  assert.equal(issue.points, 2);
});

test('sample snapshot serves the four sorted lists and keeps issue payloads minimal', () => {
  const payload = getSprintHealthSample({ today: '2026-10-01' });

  assert.equal(payload.pageState, 'ready');
  assert.equal(payload.pointsVersusTime.label, 'On track');
  assert.equal(payload.pointsVersusTime.elapsedPercent, '0.0');
  assert.equal(payload.pointsVersusTime.completedPercent, '11.1');
  assert.equal(payload.pointsVersusTime.gapDisplay, '-11.1');
  assert.deepEqual(
    Object.fromEntries(Object.entries(payload.attention).map(([name, list]) => [name, list.count])),
    { blocked: 1, overdue: 1, unassigned: 1, overloaded: 0 },
  );
  assert.equal(payload.attention.blocked.rows[0].key, 'SAM-1');
  assert.equal(payload.attention.overdue.rows[0].key, 'SAM-1');
  assert.equal(payload.attention.unassigned.rows[0].key, 'SAM-2');
  assert.deepEqual(Object.keys(payload.attention.blocked.rows[0]).sort(), [
    'assignee', 'key', 'signals', 'storyPoints', 'summary',
  ]);
});
