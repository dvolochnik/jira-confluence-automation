# Sprint Health Dashboard

The API is served at http://127.0.0.1:3000.

## Local setup

- Set `TZ` to the host IANA time zone before starting the backend.
- Configure the live Jira values in your environment or a local `.env` file:
  - `JIRA_SITE_URL`
  - `JIRA_BOARD_ID`
  - `JIRA_EMAIL`
  - `JIRA_API_TOKEN`
- The Jira API token is read-only.
- The sprint-goal status is stored in `data/goal_status.json`.
- Valid goal status values are `on_track`, `at_risk`, and `off_track`.

## Automated tests

Run from the repository root in PowerShell:

```powershell
docker compose up -d --wait postgres
$env:TEST_DATABASE_URL = 'postgresql://app:secret@127.0.0.1:5432/app'
npm --prefix backend test
npm --prefix frontend test
docker compose down
```

The backend suite requires PostgreSQL 15.19 at `127.0.0.1:5432` and an explicit
`TEST_DATABASE_URL`. The database test in `backend/src/db/job-runs.test.js` keeps
SQL under `backend/src/db/`. It creates a unique schema, sets `DATABASE_URL`
before importing backend configuration, runs the real migration and route,
and drops that schema afterward. Existing job history is not modified.
Jira HTTP is stubbed; the database test blocks non-loopback HTTP requests.
Do not add `--volumes` to the shutdown command if you want to keep job history.

## Product rules

See `project_spec.md` for the product rules and the sprint health dashboard specification.
