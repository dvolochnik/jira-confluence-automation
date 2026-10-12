const fs = require('fs');
const path = require('path');

const ENV_KEYS = ['DATA_SOURCE', 'DATABASE_URL', 'TZ', 'JIRA_SITE_URL', 'JIRA_BOARD_ID', 'JIRA_EMAIL', 'JIRA_API_TOKEN'];

function parseDotEnv(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return {};
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  const values = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    const value = rawValue.replace(/^['"]|['"]$/g, '').trim();
    values[key] = value;
  }

  return values;
}

function loadDotEnv() {
  const candidates = [];
  let current = process.cwd();

  while (current && current !== path.dirname(current)) {
    candidates.push(path.join(current, '.env'));
    current = path.dirname(current);
  }

  candidates.push(path.join(__dirname, '..', '.env'));

  const merged = {};
  for (const candidate of candidates) {
    Object.assign(merged, parseDotEnv(candidate));
  }

  return merged;
}

const envFile = loadDotEnv();
const config = {};

for (const key of ENV_KEYS) {
  config[key] = process.env[key] ?? envFile[key];
}

config.DATA_SOURCE = config.DATA_SOURCE ?? 'sample';

if (!config.DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

if (config.DATA_SOURCE !== 'sample' && config.DATA_SOURCE !== 'live') {
  console.error(`DATA_SOURCE is invalid: ${config.DATA_SOURCE}`);
  process.exit(1);
}

console.log(`DATA_SOURCE=${config.DATA_SOURCE}`);

module.exports = config;
