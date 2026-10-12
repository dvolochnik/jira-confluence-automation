const express = require('express');
const { getSprintHealthStub } = require('../services/sprint-health');

const router = express.Router();

router.get('/sprint-health', (req, res) => {
  const payload = getSprintHealthStub();
  res.status(200).json(payload);
});

module.exports = router;
