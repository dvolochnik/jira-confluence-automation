const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { getGoalStatus, saveGoalStatus } = require('../../src/services/goal-status');

async function withDirectory(run) {
  const directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'goal-status-test-'));
  try {
    await run(directory);
  } finally {
    await fs.promises.rm(directory, { recursive: true, force: true });
  }
}

test('missing, empty, invalid, and unreadable status files read as On track without writes', async () => {
  await withDirectory(async (directory) => {
    const filePath = path.join(directory, 'goal_status.json');
    assert.deepEqual(getGoalStatus({ filePath }), { status: 'on_track', label: 'On track' });
    assert.equal(fs.existsSync(filePath), false);

    fs.writeFileSync(filePath, '');
    assert.equal(getGoalStatus({ filePath }).status, 'on_track');
    assert.equal(fs.readFileSync(filePath, 'utf8'), '');

    fs.writeFileSync(filePath, JSON.stringify({ status: ' at_risk ' }));
    assert.equal(getGoalStatus({ filePath }).status, 'on_track');
    assert.equal(JSON.parse(fs.readFileSync(filePath, 'utf8')).status, ' at_risk ');
  });
});

test('valid values ignore extra keys and saves replace the file with only the status', async () => {
  await withDirectory(async (directory) => {
    const filePath = path.join(directory, 'goal_status.json');
    fs.writeFileSync(filePath, JSON.stringify({ status: 'at_risk', extra: true }));
    assert.deepEqual(getGoalStatus({ filePath }), { status: 'at_risk', label: 'At risk' });

    for (const status of ['on_track', 'at_risk', 'off_track', 'off_track']) {
      const result = await saveGoalStatus(status, { filePath });
      assert.equal(result.saved, true);
      assert.deepEqual(JSON.parse(fs.readFileSync(filePath, 'utf8')), { status });
    }
    assert.deepEqual(
      (await fs.promises.readdir(directory)).sort(),
      ['goal_status.json'],
    );
  });
});

test('failed first save leaves no target and failed later save keeps prior content', async () => {
  await withDirectory(async (directory) => {
    const missingParentPath = path.join(directory, 'missing', 'goal_status.json');
    const firstFailure = await saveGoalStatus('at_risk', { filePath: missingParentPath });
    assert.equal(firstFailure.saved, false);
    assert.equal(firstFailure.previousStatus, 'on_track');
    assert.equal(fs.existsSync(missingParentPath), false);

    const filePath = path.join(directory, 'goal_status.json');
    fs.writeFileSync(filePath, JSON.stringify({ status: 'off_track' }));
    const originalRename = fs.promises.rename;
    fs.promises.rename = async () => { throw new Error('replace failed'); };
    try {
      const result = await saveGoalStatus('at_risk', { filePath });
      assert.equal(result.saved, false);
      assert.equal(result.previousStatus, 'off_track');
      assert.deepEqual(JSON.parse(fs.readFileSync(filePath, 'utf8')), { status: 'off_track' });
    } finally {
      fs.promises.rename = originalRename;
    }
  });
});
