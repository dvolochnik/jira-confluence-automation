const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildBlockedList,
  buildOverdueList,
  buildUnassignedList,
  buildOverloadedList,
} = require('../../src/services/attention-lists.js');
const { computeCommittedAndDonePoints } = require('../../src/services/points-versus-time.js');

function issue(key, overrides = {}) {
  return {
    key,
    type: 'Story',
    statusName: 'In Progress',
    statusCategory: 'In Progress',
    points: 1,
    ...overrides,
  };
}

test('Blocked includes each matching signal once in contract order and sorts keys', () => {
  const rows = buildBlockedList([
    issue('Z-2', {
      flagged: true,
      statusName: ' blocked ',
      blockedByKeys: ['Z-9', 'A-2', 'Z-9'],
      assignee: { displayName: 'Ada', accountId: 'ada' },
    }),
    issue('A-1', { blockedByKeys: [] }),
    issue('A-4', { flagged: true, statusName: 'Blocked', blockedByKeys: null }),
    issue('A-2', { blockedByKeys: ['A-3'] }),
  ]);

  assert.deepEqual(rows.map((row) => row.key), ['A-1', 'A-2', 'A-4', 'Z-2']);
  assert.deepEqual(rows.find((row) => row.key === 'A-1').signals, ['Blocked by']);
  assert.deepEqual(rows.find((row) => row.key === 'Z-2').signals, [
    'Flagged',
    'Status: Blocked',
    'Blocked by A-2, Z-9',
  ]);
  assert.equal(rows.find((row) => row.key === 'Z-2').assignee, 'Ada');
});

test('Blocked ignores null links, outward-only links, done work, and excluded types', () => {
  const rows = buildBlockedList([
    issue('A-1', { blockedByKeys: null }),
    issue('A-2', { blocksKeys: ['A-1'] }),
    issue('A-3', { flagged: true, statusCategory: 'Done' }),
    issue('A-4', { type: 'Sub-task', flagged: true }),
    issue('A-5', { type: 'Custom', statusName: 'Blocked' }),
  ]);

  assert.deepEqual(rows, []);
});

test('Overdue includes only valid calendar dates before today and sorts by key', () => {
  const rows = buildOverdueList([
    issue('Z-1', { dueDate: '2026-09-01' }),
    issue('A-2', { dueDate: '2026-09-30', parent: { key: 'P-1' } }),
    issue('A-1', { dueDate: '2026-10-01' }),
    issue('A-3', { dueDate: '2026-10-02' }),
    issue('A-4', { dueDate: null }),
    issue('A-5', { dueDate: '' }),
    issue('A-6', { dueDate: '2026-02-30' }),
    issue('A-7', { dueDate: '2026-09-30', statusCategory: 'Done' }),
    issue('A-8', { type: 'Sub-task', dueDate: '2026-09-30', parent: { key: 'A-9' } }),
    issue('A-9', { type: 'Task', parent: { key: 'P-2' } }),
  ], '2026-10-01');

  assert.deepEqual(rows.map((row) => row.key), ['A-2', 'Z-1']);
  assert.equal(rows[0].dueDate, '2026-09-30');
  assert.equal(rows[1].dueDate, '2026-09-01');
});

test('Overdue rejects an invalid today rather than silently returning a list', () => {
  assert.throws(() => buildOverdueList([], '2026-02-30'), {
    name: 'TypeError',
    message: 'today must be a valid YYYY-MM-DD date',
  });
});

test('Unassigned requires no account id and no display name, but allows missing points', () => {
  const rows = buildUnassignedList([
    issue('A-1', { assignee: null, points: null }),
    issue('A-2', { assigneeAccountId: 'acct-1', assigneeDisplayName: '  ' }),
    issue('A-3', { assignee: { accountId: 'acct-2', displayName: 'Unassigned' } }),
    issue('A-4', { assignee: { accountId: null, displayName: '  ' } }),
    issue('A-5', { assignee: null, statusCategory: 'Done' }),
    issue('A-6', { assignee: null, type: 'Bug', points: 3, statusCategory: 'Done' }),
    issue('A-7', { assignee: null, type: 'Subtask' }),
  ]);

  assert.deepEqual(rows.map((row) => row.key), ['A-1', 'A-4']);
  assert.equal(rows[0].assignee, 'Unassigned');
  assert.equal(rows[0].storyPoints, null);

  const totals = computeCommittedAndDonePoints([
    issue('A-6', { type: 'Bug', points: 3, statusCategory: 'Done' }),
  ]);
  assert.equal(totals.committedPoints, 3);
  assert.equal(totals.donePoints, 3);
});

test('Overloaded uses per-account decimal totals, excludes zero and one-person populations', () => {
  const onePerson = buildOverloadedList([
    issue('A-1', {
      points: 5,
      assignee: { accountId: 'ada', displayName: 'Ada' },
    }),
  ]);

  assert.deepEqual(onePerson.rows, []);
  assert.equal(onePerson.median, 5);
  assert.equal(onePerson.threshold, 7.5);

  const noOpenWork = buildOverloadedList([
    issue('A-2', { points: 0, assigneeAccountId: 'bo', assigneeDisplayName: 'Bo' }),
    issue('A-3', { points: 8, assigneeAccountId: 'done', statusCategory: 'Done' }),
    issue('A-4', { points: 10, assignee: null }),
  ]);

  assert.deepEqual(noOpenWork, {
    rows: [],
    median: null,
    medianDisplay: null,
    threshold: null,
    thresholdDisplay: null,
  });
});

test('Overloaded applies strict median and five-point thresholds using exact decimal sums', () => {
  const rows = [
    ['b', 4],
    ['c', 6],
    ['d', 9],
    ['e', 9.7],
  ].map(([accountId, points]) => issue(`S-${accountId}`, {
    points,
    assigneeAccountId: accountId,
    assigneeDisplayName: accountId,
  }));
  rows.push(
    issue('S-a1', { points: 0.1, assigneeAccountId: 'a', assigneeDisplayName: 'a' }),
    issue('S-a2', { points: 0.2, assigneeAccountId: 'a', assigneeDisplayName: 'a' }),
    issue('S-e2', { points: 0.3, assigneeAccountId: 'e', assigneeDisplayName: 'e' }),
  );

  const result = buildOverloadedList(rows);

  assert.equal(result.median, 6);
  assert.equal(result.threshold, 9);
  assert.equal(result.medianDisplay, '6.0');
  assert.equal(result.thresholdDisplay, '9.0');
  assert.deepEqual(result.rows.map((row) => row.assigneeAccountId), ['e']);
  assert.equal(result.rows[0].openPoints, 10);
  assert.equal(result.rows[0].openPointsDisplay, '10');

  const belowFloor = buildOverloadedList([
    ['a', 0.1],
    ['b', 0.2],
    ['c', 0.4],
    ['d', 0.4],
    ['e', 4.9],
  ].map(([accountId, points]) => issue(`S-${accountId}`, {
    points,
    assigneeAccountId: accountId,
    assigneeDisplayName: accountId,
  })));

  assert.ok(belowFloor.threshold < 4.9);
  assert.deepEqual(belowFloor.rows, []);
});

test('Overloaded computes an even median exactly and rounds only display fields', () => {
  const result = buildOverloadedList([
    ['a', 2],
    ['b', 3],
    ['c', 4],
    ['d', 6],
  ].map(([accountId, points]) => issue(`S-${accountId}`, {
    points,
    assigneeAccountId: accountId,
    assigneeDisplayName: accountId,
  })));

  assert.equal(result.median, 3.5);
  assert.equal(result.threshold, 5.25);
  assert.equal(result.medianDisplay, '3.5');
  assert.equal(result.thresholdDisplay, '5.3');
  assert.deepEqual(result.rows.map((row) => row.assigneeAccountId), ['d']);
});

test('Overloaded sorts equal exact loads by display name with English base sensitivity', () => {
  const result = buildOverloadedList([
    ['a', 1, 'One'],
    ['b', 2, 'Two'],
    ['c', 3, 'Three'],
    ['z', 10, 'Zoe'],
    ['ada', 10, 'Ada'],
  ].map(([accountId, points, displayName]) => issue(`S-${accountId}`, {
    points,
    assigneeAccountId: accountId,
    assigneeDisplayName: displayName,
  })));

  assert.deepEqual(result.rows.map((row) => row.assignee), ['Ada', 'Zoe']);
});

test('Overloaded keeps duplicate display names separate and applies deterministic sorting', () => {
  const result = buildOverloadedList([
    ['small', 0.5, 'Small'],
    ['a', 1, 'One'],
    ['b', 2, 'Two'],
    ['c', 3, 'Three'],
    ['d', 4, 'Four'],
    ['ada', 7, 'Same'],
    ['bo', 7, 'Same'],
    ['blank', 10, '   '],
    ['top', 12, 'Zed'],
  ].map(([accountId, points, displayName]) => issue(`S-${accountId}`, {
    points,
    assigneeAccountId: accountId,
    assigneeDisplayName: displayName,
  })));

  assert.deepEqual(result.rows.map((row) => [row.assigneeAccountId, row.assignee]), [
    ['top', 'Zed'],
    ['blank', 'Unassigned'],
    ['ada', 'Same'],
    ['bo', 'Same'],
  ]);
});
