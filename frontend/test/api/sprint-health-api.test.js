import test from 'node:test';
import assert from 'node:assert/strict';

import { getSprintHealth, saveGoalStatus } from '../../src/api/sprint-health-api.js';

test('getSprintHealth fetches the stub endpoint', async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async (input, init) => {
      assert.equal(input, '/api/sprint-health');
      assert.equal(init, undefined);

      return {
        ok: true,
        async json() {
          return { pageState: 'ready', source: 'sample' };
        },
      };
    };

    const payload = await getSprintHealth();
    assert.deepEqual(payload, { pageState: 'ready', source: 'sample' });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('saveGoalStatus posts the exact status payload', async () => {
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async (input, init) => {
      assert.equal(input, '/api/goal-status');
      assert.equal(init.method, 'POST');
      assert.equal(init.headers['Content-Type'], 'application/json');
      assert.deepEqual(JSON.parse(init.body), { status: 'at_risk' });

      return {
        ok: true,
        async json() {
          return { status: 'at_risk' };
        },
      };
    };

    const payload = await saveGoalStatus('at_risk');
    assert.deepEqual(payload, { status: 'at_risk' });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
