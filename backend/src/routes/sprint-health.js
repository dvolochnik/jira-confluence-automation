const express = require('express');
const config = require('../config');
const { getSprintHealthSample, formatAsOfDate } = require('../services/sprint-health');
const { getLiveSprintHealth } = require('../services/live-sprint-health');
const { recordJobRun } = require('../services/record-job-run');

const router = express.Router();

router.get('/sprint-health', async (req, res) => {
  try {
    const today = formatAsOfDate(new Date(), process.env.TZ || 'UTC');
    const payload = config.DATA_SOURCE === 'sample'
      ? getSprintHealthSample({ today })
      : await getLiveSprintHealth({ config, today });
    await recordJobRun({
      source: payload.source,
      pageState: payload.pageState,
      sprintName: payload.sprint ? payload.sprint.name : null,
      asOfDate: payload.sprint ? payload.asOfDate || null : null,
      pointsLabel: payload.pointsVersusTime ? payload.pointsVersusTime.label : null,
      committedPoints: payload.pointsVersusTime ? payload.pointsVersusTime.committedPoints : null,
      donePoints: payload.pointsVersusTime ? payload.pointsVersusTime.donePoints : null,
      blockedCount: payload.attention?.blocked?.count ?? null,
      overdueCount: payload.attention?.overdue?.count ?? null,
      unassignedCount: payload.attention?.unassigned?.count ?? null,
      overloadedCount: payload.attention?.overloaded?.count ?? null,
      errorCode: payload.error?.code ?? null,
      httpStatus: payload.error?.httpStatus ?? null,
    });

    res.status(200).json(payload);
  } catch (error) {
    console.error('Failed to build or record sprint-health snapshot');
    res.status(500).json({ error: 'job_run_insert_failed' });
  }
});

module.exports = router;
