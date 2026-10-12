const test = require('node:test');
const assert = require('node:assert/strict');

const { isCountedIssue, isDoneIssue } = require('../../src/services/eligibility.js');

test('counted issue types include Story, Bug, and Task regardless of case or parent value', () => {
  assert.equal(isCountedIssue({ type: 'Story' }), true);
  assert.equal(isCountedIssue({ type: 'bug' }), true);
  assert.equal(isCountedIssue({ type: 'TASK' }), true);
  assert.equal(isCountedIssue({ type: 'Story', parent: { id: 'P-1' } }), true);
  assert.equal(isCountedIssue({ type: 'Sub-task' }), false);
  assert.equal(isCountedIssue({ type: 'Subtask' }), false);
  assert.equal(isCountedIssue({ type: 'User Story' }), false);
  assert.equal(isCountedIssue({ type: 'Epic' }), false);
  assert.equal(isCountedIssue({ type: 'Other' }), false);
});

test('done detection follows the status category and the done key', () => {
  assert.equal(isDoneIssue({ statusCategory: 'Done' }), true);
  assert.equal(isDoneIssue({ status: 'done' }), true);
  assert.equal(isDoneIssue({ statusCategory: 'In Progress' }), false);
  assert.equal(isDoneIssue({ status: 'To Do' }), false);
  assert.equal(isDoneIssue({ status: 'Done', statusCategory: 'In Progress' }), false);
  assert.equal(isDoneIssue({ status: 'done', statusCategory: 'not_done' }), false);
});
