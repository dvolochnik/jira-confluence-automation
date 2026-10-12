const express = require('express');
const config = require('./config');
const { migrate } = require('./db/migrate');
const sprintHealthRoutes = require('./routes/sprint-health');
const goalStatusRoutes = require('./routes/goal-status');

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.use(express.json());
app.use('/api', sprintHealthRoutes);
app.use('/api', goalStatusRoutes);

async function start() {
  await migrate();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend listening on http://0.0.0.0:${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start backend', error);
  process.exit(1);
});

module.exports = { app };
