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

## Product rules

See `project_spec.md` for the product rules and the sprint health dashboard specification.
