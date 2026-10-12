const express = require('express');
const config = require('../config');
const { getSprintHealthStub, getSprintHealthSample, formatAsOfDate } = require('../services/sprint-health');
const { recordJobRun } = require('../services/record-job-run');

const router = express.Router();

router.get('/sprint-health', async (req, res) => {
  try {
    const payload = config.DATA_SOURCE === 'sample'
      ? getSprintHealthSample({ today: formatAsOfDate(new Date(), process.env.TZ || 'UTC') })
      : getSprintHealthStub();

    await recordJobRun({
      source: payload.source,
      pageState: payload.pageState,
      sprintName: payload.sprint ? payload.sprint.name : null,
      asOfDate: payload.asOfDate || null,
      pointsLabel: payload.pointsVersusTime ? payload.pointsVersusTime.label : null,
      committedPoints: payload.pointsVersusTime ? payload.pointsVersusTime.committedPoints : 0,
      donePoints: payload.pointsVersusTime ? payload.pointsVersusTime.donePoints : 0,
      blockedCount: payload.attention ? payload.attention[0]?.count ?? 0 : 0,
      overdueCount: payload.attention ? payload.attention[1]?.count ?? 0 : 0,
      unassignedCount: payload.attention ? payload.attention[2]?.count ?? 0 : 0,
      overloadedCount: payload.attention ? payload.attention[3]?.count ?? 0 : 0,
    });

    res.status(200).json(payload);
  } catch (error) {
    console.error('Failed to record sprint-health job run', error);
    res.status(500).json({ error: 'job_run_insert_failed' });
  }
});

module.exports = router;
