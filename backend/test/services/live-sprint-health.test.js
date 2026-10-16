const test = require('node:test');
const assert = require('node:assert/strict');

const {
  getMissingLiveVariable,
  getLiveSprintHealth,
} = require('../../src/services/live-sprint-health');

const completeConfig = {
  JIRA_SITE_URL: 'https://jira.example/',
  JIRA_BOARD_ID: '12',
  JIRA_EMAIL: 'manager@example.invalid',
  JIRA_API_TOKEN: 'test-token',
};
const savedGoalStatus = { status: 'at_risk', label: 'At risk' };

test('live config validation checks names in order and only allows an HTTPS origin', () => {
  assert.equal(getMissingLiveVariable({}), 'JIRA_SITE_URL');
  assert.equal(getMissingLiveVariable({ ...completeConfig, JIRA_SITE_URL: 'http://jira.example' }), 'JIRA_SITE_URL');
  assert.equal(getMissingLiveVariable({ ...completeConfig, JIRA_SITE_URL: 'https://user@jira.example' }), 'JIRA_SITE_URL');
  assert.equal(getMissingLiveVariable({ ...completeConfig, JIRA_SITE_URL: 'https://jira.example/path' }), 'JIRA_SITE_URL');
  assert.equal(getMissingLiveVariable({ ...completeConfig, JIRA_SITE_URL: 'https://jira.example//' }), 'JIRA_SITE_URL');
  assert.equal(getMissingLiveVariable({ ...completeConfig, JIRA_BOARD_ID: '0' }), 'JIRA_BOARD_ID');
  assert.equal(getMissingLiveVariable({ ...completeConfig, JIRA_BOARD_ID: '12x' }), 'JIRA_BOARD_ID');
  assert.equal(getMissingLiveVariable(completeConfig), null);
});

test('missing config returns the first variable and does not create a Jira client', async () => {
  let called = false;
  const payload = await getLiveSprintHealth({
    config: { ...completeConfig, JIRA_EMAIL: '' },
    today: '2026-10-01',
    getGoalStatus: () => savedGoalStatus,
    client: { async getActiveSprints() { called = true; return []; } },
  });
  assert.equal(called, false);
  assert.equal(payload.pageState, 'missing_config');
  assert.equal(payload.error.missingVariable, 'JIRA_EMAIL');
  assert.equal(payload.error.message, 'Missing configuration: JIRA_EMAIL.');
  assert.equal(payload.goalStatus.status, 'at_risk');
  assert.equal(payload.attention, null);
});

test('zero or multiple active sprints return explicit errors without choosing sample rows', async () => {
  for (const [sprints, pageState, message] of [
    [[], 'no_active_sprint', 'This board has no active sprint.'],
    [[{ id: 1 }, { id: 2 }], 'multiple_active_sprints', 'This board has more than one active sprint.'],
  ]) {
    const payload = await getLiveSprintHealth({
      config: completeConfig,
      today: '2026-10-01',
      getGoalStatus: () => savedGoalStatus,
      client: { async getActiveSprints() { return sprints; } },
    });
    assert.equal(payload.pageState, pageState);
    assert.equal(payload.error.message, message);
    assert.equal(payload.sprint, null);
    assert.equal(payload.pointsVersusTime, null);
    assert.equal(payload.attention, null);
    assert.deepEqual(payload.goalStatus, savedGoalStatus);
  }
});

test('one active sprint uses the shared calculations and list rules', async () => {
  const client = {
    async getActiveSprints() { return [{ id: 1 }]; },
    async getSprintSnapshot() {
      return {
        name: 'Live Sprint',
        startDate: '2026-10-01',
        endDate: '2026-10-11',
        goal: 'Deliver safely.',
        issues: [
          {
            key: 'LIVE-1', type: 'Story', statusName: 'Blocked',
            statusCategory: 'In Progress', points: 5, flagged: true,
            blockedByKeys: ['LIVE-2'], dueDate: '2026-09-30', assignee: null,
          },
        ],
      };
    },
  };
  const payload = await getLiveSprintHealth({
    config: completeConfig,
    today: '2026-10-06',
    client,
    getGoalStatus: () => savedGoalStatus,
  });

  assert.equal(payload.pageState, 'ready');
  assert.equal(payload.source, 'live');
  assert.equal(payload.pointsVersusTime.elapsedPercent, '50.0');
  assert.equal(payload.pointsVersusTime.committedPoints, 5);
  assert.deepEqual(payload.attention.blocked.rows[0].signals, [
    'Flagged', 'Status: Blocked', 'Blocked by LIVE-2',
  ]);
  assert.equal(payload.attention.blocked.rows[0].url, 'https://jira.example/browse/LIVE-1');
  assert.equal(payload.attention.overdue.rows[0].key, 'LIVE-1');
  assert.equal(payload.attention.unassigned.rows[0].key, 'LIVE-1');
  assert.equal(payload.goalStatus.status, 'at_risk');
});

test('source failures expose only safe text and preserve Jira HTTP status', async () => {
  const payload = await getLiveSprintHealth({
    config: completeConfig,
    today: '2026-10-01',
    getGoalStatus: () => savedGoalStatus,
    client: { async getActiveSprints() { throw Object.assign(new Error('private details'), { status: 404 }); } },
  });
  assert.equal(payload.pageState, 'source_error');
  assert.equal(payload.error.message, 'The sprint could not be loaded.');
  assert.equal(payload.error.httpStatus, null);
  assert.equal(JSON.stringify(payload).includes('private details'), false);
});
