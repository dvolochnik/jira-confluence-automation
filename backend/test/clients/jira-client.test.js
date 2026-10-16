const test = require('node:test');
const assert = require('node:assert/strict');

const {
  JiraHttpError,
  createJiraClient,
  mapIssue,
} = require('../../src/clients/jira-client');

function response(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() { return body; },
  };
}

test('Jira client uses GET with basic auth, selects the story field, and maps only safe fields', async () => {
  const requests = [];
  const replies = [
    { values: [{ id: 42, name: 'Current', startDate: '2026-10-01', endDate: '2026-10-15' }], isLast: true },
    [{ id: 'customfield_10001', name: 'Story Points' }, { id: 'customfield_10002', name: 'Other Number' }],
    {
      total: 1,
      issues: [{
        key: 'LIVE-1',
        fields: {
          summary: 'Plain summary',
          issuetype: { name: 'Story' },
          status: { name: 'Blocked', statusCategory: { key: 'indeterminate', name: 'In Progress' } },
          assignee: { accountId: 'acct', displayName: 'Ada' },
          duedate: '2026-09-30T23:00:00Z',
          parent: { key: 'LIVE-0' },
          flagged: true,
          issuelinks: [
            { type: { inward: ' Is Blocked By ' }, inwardIssue: { key: 'LIVE-2' } },
            { type: { inward: 'blocks' }, inwardIssue: { key: 'LIVE-3' } },
          ],
          customfield_10001: 0.5,
          description: 'must not be requested or returned',
        },
      }],
    },
  ];
  const client = createJiraClient({
    siteUrl: 'https://jira.example',
    boardId: '12',
    email: 'manager@example.invalid',
    apiToken: 'test-token',
    timeZone: 'UTC',
    fetchImpl: async (url, options) => {
      requests.push({ url: new URL(url), options });
      return response(replies.shift());
    },
  });
  const sprints = await client.getActiveSprints();
  const sprint = await client.getSprintSnapshot(sprints[0]);

  assert.equal(requests.length, 3);
  assert.equal(requests[0].url.pathname, '/rest/agile/1.0/board/12/sprint');
  assert.equal(requests[0].url.searchParams.get('state'), 'active');
  assert.equal(requests[1].url.pathname, '/rest/api/3/field');
  assert.equal(requests[2].url.pathname, '/rest/agile/1.0/sprint/42/issue');
  for (const { options } of requests) {
    assert.equal(options.method, 'GET');
    assert.equal(options.headers.Authorization, `Basic ${Buffer.from('manager@example.invalid:test-token').toString('base64')}`);
    assert.equal(options.signal.aborted, false);
  }
  const selectedFields = requests[2].url.searchParams.get('fields').split(',');
  assert.ok(selectedFields.includes('customfield_10001'));
  assert.ok(!selectedFields.includes('description'));
  assert.ok(!selectedFields.includes('comment'));
  assert.deepEqual(sprint.issues, [{
    key: 'LIVE-1',
    summary: 'Plain summary',
    type: 'Story',
    statusName: 'Blocked',
    statusCategory: 'In Progress',
    assignee: { accountId: 'acct', displayName: 'Ada' },
    dueDate: '2026-09-30',
    parentSet: true,
    flagged: true,
    blockedByKeys: ['LIVE-2'],
    points: 0.5,
  }]);
});

test('missing point field yields null points and a matching link without a key signals an empty array', () => {
  const issue = mapIssue({
    key: 'LIVE-2',
    fields: {
      issuelinks: [{ type: { inward: 'is blocked by' }, inwardIssue: {} }],
    },
  }, { timeZone: 'UTC' });
  assert.equal(issue.points, null);
  assert.equal(issue.blockedByKeys.length, 0);
  assert.equal(issue.parentSet, false);
  assert.equal(issue.flagged, false);
  assert.equal(mapIssue({ key: 'LIVE-3', fields: { issuelinks: [] } }, { timeZone: 'UTC' }).blockedByKeys, null);
});

test('client discards a sprint issue page when a later page fails', async () => {
  let issuePage = 0;
  const client = createJiraClient({
    siteUrl: 'https://jira.example',
    boardId: '12',
    email: 'manager@example.invalid',
    apiToken: 'test-token',
    fetchImpl: async (url) => {
      const parsed = new URL(url);
      if (parsed.pathname.endsWith('/sprint')) return response({ values: [{ id: 1 }], isLast: true });
      if (parsed.pathname === '/rest/api/3/field') return response([]);
      issuePage += 1;
      if (issuePage === 1) {
        return response({
          total: 51,
          issues: Array.from({ length: 50 }, (_, index) => ({ key: `K-${index}`, fields: {} })),
        });
      }
      return response({ errorMessages: ['unavailable'] }, 503);
    },
  });
  const sprint = (await client.getActiveSprints())[0];
  await assert.rejects(client.getSprintSnapshot(sprint), (error) => {
    assert.ok(error instanceof JiraHttpError);
    assert.equal(error.status, 503);
    return true;
  });
});
