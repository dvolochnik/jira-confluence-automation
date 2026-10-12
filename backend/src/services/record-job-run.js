const { Client } = require('pg');
const config = require('../config');
const { INSERT_JOB_RUN } = require('../db/queries/job-runs');

async function recordJobRun({
  source = 'sample',
  pageState = 'ready',
  sprintName = null,
  asOfDate = null,
  pointsLabel = null,
  committedPoints = 0,
  donePoints = 0,
  blockedCount = 0,
  overdueCount = 0,
  unassignedCount = 0,
  overloadedCount = 0,
  errorCode = null,
  httpStatus = null,
} = {}) {
  const startedAt = new Date();
  const client = new Client({ connectionString: config.DATABASE_URL });

  try {
    await client.connect();
    await client.query(INSERT_JOB_RUN, [
      startedAt,
      new Date(),
      source,
      pageState,
      sprintName,
      asOfDate,
      pointsLabel,
      committedPoints,
      donePoints,
      blockedCount,
      overdueCount,
      unassignedCount,
      overloadedCount,
      errorCode,
      httpStatus,
    ]);
  } finally {
    await client.end();
  }
}

module.exports = { recordJobRun };
