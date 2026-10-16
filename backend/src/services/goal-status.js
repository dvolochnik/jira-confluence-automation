const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const GOAL_STATUS_PATH = '/app/data/goal_status.json';
const LABELS = {
  on_track: 'On track',
  at_risk: 'At risk',
  off_track: 'Off track',
};

function isValidStatus(status) {
  return Object.hasOwn(LABELS, status);
}

function getGoalStatus({ filePath = GOAL_STATUS_PATH } = {}) {
  try {
    const stored = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (stored && typeof stored === 'object' && isValidStatus(stored.status)) {
      return { status: stored.status, label: LABELS[stored.status] };
    }
  } catch {
    return { status: 'on_track', label: LABELS.on_track };
  }

  return { status: 'on_track', label: LABELS.on_track };
}

async function saveGoalStatus(status, { filePath = GOAL_STATUS_PATH } = {}) {
  if (!isValidStatus(status)) {
    return { saved: false, previousStatus: getGoalStatus({ filePath }).status };
  }

  const previousStatus = getGoalStatus({ filePath }).status;
  const directory = path.dirname(filePath);
  const temporaryPath = path.join(directory, `.${path.basename(filePath)}.${randomUUID()}.tmp`);
  let handle;

  try {
    handle = await fs.promises.open(temporaryPath, 'wx', 0o600);
    await handle.writeFile(`${JSON.stringify({ status })}\n`, 'utf8');
    await handle.sync();
    await handle.close();
    handle = null;
    await fs.promises.rename(temporaryPath, filePath);
    return { saved: true, status, label: LABELS[status] };
  } catch (error) {
    if (handle) {
      await handle.close();
    }
    try {
      await fs.promises.unlink(temporaryPath);
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') {
        error.cleanupError = cleanupError;
      }
    }
    return { saved: false, previousStatus, error };
  }
}

module.exports = {
  GOAL_STATUS_PATH,
  LABELS,
  isValidStatus,
  getGoalStatus,
  saveGoalStatus,
};
