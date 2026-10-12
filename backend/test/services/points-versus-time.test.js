const test = require('node:test');
const assert = require('node:assert/strict');

const {
  calculateElapsedPercent,
  computeCommittedAndDonePoints,
  computePointsVersusTime,
  getBandFromGap,
  formatSignedOneDecimal,
} = require('../../src/services/points-versus-time.js');

test('elapsed percent matches the sprint date rules', () => {
  assert.equal(calculateElapsedPercent('2026-10-01', '2026-10-11', '2026-10-06'), 50);
  assert.equal(calculateElapsedPercent('2026-10-01', '2026-10-11', '2026-09-30'), 0);
  assert.equal(calculateElapsedPercent('2026-10-01', '2026-10-11', '2026-10-01'), 0);
  assert.equal(calculateElapsedPercent('2026-10-01', '2026-10-11', '2026-10-11'), 100);
  assert.equal(calculateElapsedPercent('2026-10-05', '2026-10-05', '2026-10-05'), 100);
  assert.equal(calculateElapsedPercent('2026-10-05', '2026-10-05', '2026-10-04'), 0);
});

test('the health band uses the exact gap, not the rounded display', () => {
  assert.equal(getBandFromGap(-1), 'On track');
  assert.equal(getBandFromGap(0), 'On track');
  assert.equal(getBandFromGap(1), 'At risk');
  assert.equal(getBandFromGap(15), 'At risk');
  assert.equal(getBandFromGap(15.000000000000004), 'Off track');
  assert.equal(getBandFromGap(20), 'Off track');
  assert.equal(formatSignedOneDecimal(15.000000000000004), '+15.0');
  assert.equal(formatSignedOneDecimal(-11.1), '-11.1');
  assert.equal(formatSignedOneDecimal(0), '0.0');
});

test('points totals keep exact values while ignoring invalid point inputs', () => {
  const totals = computeCommittedAndDonePoints([
    { type: 'Story', statusCategory: 'Done', points: 18.3 },
    { type: 'Bug', statusCategory: 'In Progress', points: -5 },
    { type: 'Task', statusCategory: 'Done', points: '0.5' },
    { type: 'Sub-task', statusCategory: 'Done', points: 100 },
    { type: 'Task', statusCategory: 'Done', points: 'abc' },
    { type: 'Task', statusCategory: 'Done', points: null },
    { type: 'Story', statusCategory: 'Done', points: 0 },
  ]);

  assert.equal(totals.committedPoints, 18.8);
  assert.equal(totals.donePoints, 18.8);
  assert.equal(totals.completedPercent, 100);
});

test('the service returns the exact gap display and label for the sample-style values', () => {
  const summary = computePointsVersusTime({
    start: '2026-10-01',
    end: '2026-10-04',
    today: '2026-10-02',
    completedPercent: 18.3,
  });

  assert.equal(summary.elapsedDisplay, '33.3');
  assert.equal(summary.gapDisplay, '+15.0');
  assert.equal(summary.label, 'Off track');
  assert.equal(summary.gap > 15, true);
});

test('missing or invalid dates produce no elapsed percent and no label', () => {
  assert.equal(calculateElapsedPercent('', '2026-10-11', '2026-10-06'), null);
  assert.equal(calculateElapsedPercent('not-a-date', '2026-10-11', '2026-10-06'), null);
  assert.equal(calculateElapsedPercent('2026-10-11', '2026-10-01', '2026-10-06'), null);

  const summary = computePointsVersusTime({
    start: null,
    end: '2026-10-11',
    today: '2026-10-06',
    completedPercent: 50,
  });

  assert.equal(summary.elapsedPercent, null);
  assert.equal(summary.label, null);
  assert.equal(summary.gapDisplay, null);
});
