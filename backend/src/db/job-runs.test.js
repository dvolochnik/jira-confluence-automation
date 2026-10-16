const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createServer } = require('node:http');
const express = require('express');
const { Client } = require('pg');

test('sprint-health GET persists isolated PostgreSQL job runs', async (context) => {
  assert.ok(process.env.TEST_DATABASE_URL, 'Set TEST_DATABASE_URL to PostgreSQL 15.19 at 127.0.0.1:5432');
  const databaseUrl = new URL(process.env.TEST_DATABASE_URL);
  assert.equal(databaseUrl.hostname, '127.0.0.1');
  assert.equal(databaseUrl.port, '5432');
  const schema = `job_runs_test_${randomUUID().replaceAll('-', '')}`;
  databaseUrl.searchParams.set('options', `-c search_path=${schema}`);
  process.env.DATABASE_URL = databaseUrl.toString();
  process.env.DATA_SOURCE = 'sample';
  process.env.TZ = 'UTC';

  const client = new Client({ connectionString: databaseUrl.toString() });
  await client.connect();
  context.after(async () => {
    try {
      await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    } finally {
      await client.end();
    }
  });
  const version = await client.query('SHOW server_version');
  assert.match(version.rows[0].server_version, /^15\.19(?:\s|$)/);
  await client.query(`CREATE SCHEMA "${schema}"`);

  const config = require('../config');
  const { migrate } = require('./migrate');
  await migrate();
  await migrate();
  const app = express();
  app.use('/api', require('../routes/sprint-health'));
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  context.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const originalFetch = global.fetch;
  let jiraResponse;
  context.mock.method(global, 'fetch', async (input, options) => {
    const url = new URL(input);
    if (url.origin === baseUrl) return originalFetch(input, options);
    assert.equal(url.origin, 'https://private-jira.invalid');
    assert.equal(options.method, 'GET');
    if (url.pathname === '/rest/api/3/field') return Response.json([]);
    return jiraResponse();
  });

  await context.test('one complete row per GET, including ignored query parameters', async () => {
    for (const suffix of ['', '?sprintId=9']) {
      const before = await client.query('SELECT count(*)::int AS count FROM job_runs');
      const response = await fetch(`${baseUrl}/api/sprint-health${suffix}`);
      assert.equal(response.status, 200);
      const payload = await response.json();
      const result = await client.query('SELECT * FROM job_runs ORDER BY id');
      assert.equal(result.rows.length, before.rows[0].count + 1);
      const row = result.rows.at(-1);
      assert.equal(row.source, 'sample');
      assert.equal(row.page_state, payload.pageState);
      assert.equal(row.sprint_name, payload.sprint.name);
      assert.equal(row.as_of_date.toISOString().slice(0, 10), payload.asOfDate);
      assert.equal(row.points_label, payload.pointsVersusTime.label);
      assert.equal(row.committed_points, String(payload.pointsVersusTime.committedPoints));
      assert.equal(row.done_points, String(payload.pointsVersusTime.donePoints));
      for (const list of ['blocked', 'overdue', 'unassigned', 'overloaded']) {
        assert.equal(row[`${list}_count`], payload.attention[list].count);
      }
      assert.ok(row.started_at instanceof Date);
      assert.ok(row.finished_at >= row.started_at);
      assert.equal(row.error_code, null);
      assert.equal(row.http_status, null);
    }
  });

  await context.test('all four live error states persist safe rows with null snapshot fields', async (errorContext) => {
    config.DATA_SOURCE = 'live';
    Object.assign(config, {
      JIRA_SITE_URL: 'https://private-jira.invalid',
      JIRA_BOARD_ID: '123',
      JIRA_EMAIL: 'private-email@example.invalid',
      JIRA_API_TOKEN: 'private-api-token',
    });
    const privateContents = [config.JIRA_SITE_URL, config.JIRA_EMAIL, config.JIRA_API_TOKEN,
      'private-issue-summary', 'private-issue-description'];
    const cases = [
      { state: 'missing_config', response: () => assert.fail('Missing config must not call Jira') },
      { state: 'no_active_sprint', response: () => Response.json({ values: [] }) },
      { state: 'multiple_active_sprints', response: () => Response.json({ values: [{ id: 1 }, { id: 2 }] }) },
      { state: 'source_error', response: () => new Response(privateContents.join(' '), { status: 401 }) },
    ];
    for (const entry of cases) {
      await errorContext.test(entry.state, async () => {
        config.JIRA_BOARD_ID = entry.state === 'missing_config' ? '' : '123';
        jiraResponse = entry.response;
        const before = await client.query('SELECT count(*)::int AS count FROM job_runs');
        const response = await fetch(`${baseUrl}/api/sprint-health`);
        assert.equal(response.status, 200);
        const payload = await response.json();
        assert.equal(payload.pageState, entry.state);
        const result = await client.query('SELECT * FROM job_runs ORDER BY id');
        assert.equal(result.rows.length, before.rows[0].count + 1);
        const row = result.rows.at(-1);
        assert.deepEqual(Object.keys(row).sort(), [
          'id', 'started_at', 'finished_at', 'source', 'page_state', 'sprint_name',
          'as_of_date', 'points_label', 'committed_points', 'done_points',
          'blocked_count', 'overdue_count', 'unassigned_count', 'overloaded_count',
          'error_code', 'http_status',
        ].sort());
        assert.equal(row.source, 'live');
        assert.equal(row.page_state, entry.state);
        assert.equal(row.error_code, entry.state);
        assert.equal(row.http_status, entry.state === 'source_error' ? 401 : null);
        for (const column of ['sprint_name', 'as_of_date', 'points_label', 'committed_points',
          'done_points', 'blocked_count', 'overdue_count', 'unassigned_count', 'overloaded_count']) {
          assert.equal(row[column], null, column);
        }
        for (const secret of privateContents) assert.ok(!JSON.stringify(row).includes(secret));
      });
    }
  });

  await context.test('a PostgreSQL insert rejection returns 500 without recording a row', async () => {
    config.DATA_SOURCE = 'sample';
    const before = await client.query('SELECT count(*)::int AS count FROM job_runs');
    await client.query('ALTER TABLE job_runs ADD CONSTRAINT reject_insert CHECK (false) NOT VALID');
    try {
      const response = await fetch(`${baseUrl}/api/sprint-health`);
      assert.equal(response.status, 500);
      assert.deepEqual(await response.json(), { error: 'job_run_insert_failed' });
      const after = await client.query('SELECT count(*)::int AS count FROM job_runs');
      assert.equal(after.rows[0].count, before.rows[0].count);
    } finally {
      await client.query('ALTER TABLE job_runs DROP CONSTRAINT reject_insert');
    }
  });
});