const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const config = require('../config');

const migrationSql = fs.readFileSync(
  path.join(__dirname, 'migrations', '001_create_job_runs.sql'),
  'utf8'
);

async function migrate() {
  const client = new Client({ connectionString: config.DATABASE_URL });

  try {
    await client.connect();
    await client.query(migrationSql);
  } finally {
    await client.end();
  }
}

module.exports = { migrate };
