const test = require('node:test');
const assert = require('node:assert/strict');

const sprint = require('../../sample/sprint.json');
const { computeCommittedAndDonePoints } = require('../../src/services/points-versus-time.js');

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
