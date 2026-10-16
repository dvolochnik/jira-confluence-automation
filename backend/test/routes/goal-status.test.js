const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createServer } = require('http');

const { createGoalStatusRouter } = require('../../src/routes/goal-status');

async function withServer(filePath, run) {
  const app = express();
  app.use(express.json());
  app.use(createGoalStatusRouter({ filePath }));
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test('POST saves allowed statuses and rejects invalid tokens without changing the file', async () => {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'goal-route-test-'));
  const filePath = path.join(directory, 'goal_status.json');
  try {
    await withServer(filePath, async (baseUrl) => {
      let response = await fetch(`${baseUrl}/goal-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'at_risk' }),
      });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { status: 'at_risk', label: 'At risk' });
      const savedFile = fs.readFileSync(filePath, 'utf8');

      response = await fetch(`${baseUrl}/goal-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'At risk' }),
      });
      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { error: 'invalid_status' });
      assert.equal(fs.readFileSync(filePath, 'utf8'), savedFile);
    });
  } finally {
    await fs.promises.rm(directory, { recursive: true, force: true });
  }
});

test('failed save reports the previous selection and a first failure stays unwritten', async () => {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'goal-route-failure-test-'));
  const filePath = path.join(directory, 'missing', 'goal_status.json');
  try {
    await withServer(filePath, async (baseUrl) => {
      const originalError = console.error;
      console.error = () => {};
      try {
        const response = await fetch(`${baseUrl}/goal-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'off_track' }),
        });
        assert.equal(response.status, 500);
        assert.deepEqual(await response.json(), {
          error: 'save_failed',
          status: 'on_track',
          label: 'On track',
        });
        assert.equal(fs.existsSync(filePath), false);
      } finally {
        console.error = originalError;
      }
    });
  } finally {
    await fs.promises.rm(directory, { recursive: true, force: true });
  }
});
