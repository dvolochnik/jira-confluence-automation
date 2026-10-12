const express = require('express');

const router = express.Router();

router.post('/goal-status', (req, res) => {
  res.status(400).json({ error: 'invalid_status' });
});

module.exports = router;
