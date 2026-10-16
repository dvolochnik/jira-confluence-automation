const express = require('express');
const { getGoalStatus, isValidStatus, saveGoalStatus, LABELS } = require('../services/goal-status');

function createGoalStatusRouter({ filePath } = {}) {
  const router = express.Router();

  router.post('/goal-status', async (req, res) => {
    const status = req.body?.status;
    if (!isValidStatus(status)) {
      return res.status(400).json({ error: 'invalid_status' });
    }

    const result = await saveGoalStatus(status, { filePath });
    if (result.saved) {
      return res.status(200).json({ status: result.status, label: result.label });
    }

    console.error('Failed to save goal status', result.error);
    return res.status(500).json({
      error: 'save_failed',
      status: result.previousStatus,
      label: LABELS[result.previousStatus],
    });
  });
  return router;
}

const router = createGoalStatusRouter();

module.exports = router;
module.exports.createGoalStatusRouter = createGoalStatusRouter;
