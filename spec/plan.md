# Implementation Plan: Sprint Health Dashboard

**Feature branch**: `001-sprint-health-dashboard`

**Created**: 2026-10-09

**Status**: Ready for implementation

**Sources**: `spec/constitution.md` 1.1.0, `spec/specification.md` (Draft), `project_spec.md`, and the justifications in `spec/clarify.md`.

This plan is the build order for one local page: a manager reads one sprint and records one goal judgment. The constitution’s runtime wins where `spec/clarify.md` says so (C-01, C-02, C-03). Dashboard behavior follows the specification and the other clarify justifications.

The repository currently has empty frontend and backend entry files, an empty Compose file, and a README for an unrelated Python calculator. This plan replaces that skeleton. It does not add a second product.

## How the conflicts were closed

| Id | Choice this plan implements |
| --- | --- |
| C-01, C-02, C-03 | Constitution runtime stays. Compose runs frontend, backend, and PostgreSQL 15.19. Every snapshot load is a job run stored in PostgreSQL. The dashboard does not become a Confluence writer. |
| C-04 | Story, Bug, and Task count even when `parent` is set. Sub-task, Subtask, and any other type are excluded. An epic parent does not exclude a story. |
| C-05 | FR-045 stands. The default file is one sprint with a non-empty goal. Other bands and the special cases live in separate fixtures. |
| C-06 | The API keeps one `error.missingVariable`. The screen names only that variable. Check order: `JIRA_SITE_URL`, `JIRA_BOARD_ID`, `JIRA_EMAIL`, `JIRA_API_TOKEN`. |
| C-07 | FR-038 stands. A negative number is stored and may be shown as that number. The sum adds zero. Null and non-numeric points show an em dash and add zero. A stored zero shows `0`. |
| C-08 | FR-027 stands. A missing display name renders as “Unassigned” on the row and on Overloaded. List membership still treats an account id as assigned, so that row is not on the Unassigned list. |
| C-09 | FR-029 stands. `blockedByKeys: null` means the link signal is false. `blockedByKeys: []` means the signal is true and the row says “Blocked by” with no key. |
| C-10, G-05 | Today is the host calendar. Compose sets `TZ` from the host. A date-only string is that date. A datetime becomes the calendar date in `TZ`. |
| C-11 | FR-017 stands on every state, including errors. No goal text means the sentence “The goal is not set.” |
| C-12 | On `missing_config` the goal control stays visible and `POST /api/goal-status` still works. |
| C-13 | The goal is shown in full, including newlines (`white-space: pre-wrap`). A long goal may extend the summary past the first screen. |
| C-14, C-06 | The API chapter is binding. The stricter rule is the single missing-variable field. |
| C-15 | Rewriting the same token is an API rule. The radios do not have to fire again for the selected value. |
| G-01 | Pins below are required. A lockfile is required. The frontend image builds with Vite and serves with `vite preview`. C-02 overrides the “no PostgreSQL” exception, so this plan does not record one. |
| G-02 | Backend URL, database port, and the goal-file mount are fixed in Phase 1. The frontend URL and `/api` proxy are fixed in Phase 2. |
| G-03, U-01 | Rules take an injected `today`. The running app passes the process calendar date. Display rounding is half-up, once, in the backend. `label` is the band. |
| G-04, U-02 | A null, empty, unparseable, or inverted sprint date is `dates_unavailable`. Missing dates win over the zero-commitment On track rule. The same-day rule replaces the division. |
| G-06, G-07, G-08 | Live calls, mapper defaults, and config checks are the last feature in Phase 3. |
| G-09 | Sample paths and the “no URL in fixtures” rule land with the sample-snapshot feature in Phase 3. |
| G-10, G-11, U-08, U-11 | The screen matrix and the exact sentences below are the copy contract. |
| G-12 | Live issue URL is the HTTPS origin plus `/browse/` plus the key, `target="_blank"`, `rel="noopener noreferrer"`. The sprint-name link is omitted. |
| G-13, U-07, G-14 | Atomic goal file, extra keys ignored, no staleness warning. |
| G-15 | Automated cases are listed in the test section. `frontend/test/` covers the API client only. The browser check is manual. |
| U-03, U-04, U-05, U-06 | Matching, sort, person key, and decimal display rules below. |
| U-09 | `DATA_SOURCE` is case-sensitive and read once at process start. Unknown query parameters, including a sprint id, are ignored. |
| U-10 | Logs may include issue keys, `pageState`, and the source word. They must not include summaries, descriptions, emails, tokens, or raw environment values. |

## Constitution Check

Evaluated against constitution 1.1.0. A failing row blocks the phase that owns it.

| Principle | Result | How this plan satisfies it |
| --- | --- | --- |
| I. Layer boundaries | Pass | React 18.3.1 and Vite 8.3.4 render and call Express only. Express 5.2.1 on Node.js 24.21.0 owns rules, the Jira client, validation, and persistence. PostgreSQL 15.19 is reached only from the backend. |
| II. Test-backed automation | Pass | Band, list, eligibility, mapper, goal-file, and job-run behaviors have Node.js tests. Default tests open no socket to Atlassian. Database tests use PostgreSQL 15.19. Live HTTP is stubbed. |
| III. Least privilege | Pass | Credentials come from the environment. This feature’s Jira calls are GET. No Jira or Confluence write exists. A failed Jira call does not change the goal file. The job-run row records the failure without secrets. |
| IV. Docker-portable runtime | Pass | Compose at the repo root pins `node:24.21.0` and `postgres:15.19`. Host ports bind to 127.0.0.1. |
| V. Small surface | Pass | One Express process. No worker, queue, or cache. Complexity tracking justifies the goal file and the local decimal helper. |
| Technology pins | Pass | Backend pins in Phase 1. Frontend pins in Phase 2. `pg` 8.23.1 is the only database driver. |
| Folder structure and names | Pass | Phase 1 creates the backend tree. Phase 2 creates the frontend tree. |
| Confluence and remote write-back | Pass, with scope note | Principle III applies when a write exists. This feature has no such action. Principle V forbids an unused Confluence client. A later feature adds `backend/src/clients/confluence-client.js` only when a spec names a Confluence read or write. |

## Complexity tracking

| Addition | Need the pins cannot meet | Decision |
| --- | --- | --- |
| `postgres` Compose service | Constitution Principle I and IV require PostgreSQL 15.19 | Include |
| `data/goal_status.json` | The feature and G-13 require this host file as the only manager write. PostgreSQL stores job runs, not a second copy of the judgment | Keep the file. Do not also store the judgment in a table |
| Local decimal helper | IEEE floats can move a true gap of 15 across the band. The Node.js standard library has no decimal type | `backend/src/services/decimal-amount.js`. No new package |
| Confluence client | No story reads or writes Confluence | Not in this plan |
| DOM test library | NFR-009 forbids a browser in the automated suite | Not added |

## Runtime contract

### Pins

| Layer | Pin |
| --- | --- |
| Frontend UI | React 18.3.1, React DOM 18.3.1 |
| Frontend build and serve | Vite 8.3.4 (`vite build`, then `vite preview`) |
| Backend | Node.js 24.21.0, Express 5.2.1, `pg` 8.23.1 |
| Database | `postgres:15.19` |
| Lockfiles | `frontend/package-lock.json`, `backend/package-lock.json` |

### Compose

| Service | Image | Host binding | Container listen |
| --- | --- | --- | --- |
| `frontend` | `node:24.21.0` | `127.0.0.1:5173` | `0.0.0.0:5173` |
| `backend` | `node:24.21.0` | `127.0.0.1:3000` | `0.0.0.0:3000` |
| `postgres` | `postgres:15.19` | `127.0.0.1:5432` | `5432` |

The manager opens `http://127.0.0.1:5173`. Vite proxies `/api` to `http://backend:3000`. The browser does not call port 3000 and does not need CORS.

`postgres` has a healthcheck. `backend` starts after the database is healthy and runs migrations before it listens. `frontend` can start in parallel. If the first `GET /api/sprint-health` fails, the page shows “The sprint could not be loaded.” and no issue rows.

`TZ` is passed from the host environment into `backend`. The README tells the operator to set `TZ` to the host zone (IANA name, such as `Europe/Minsk`). Unset `TZ` leaves the image default, which is the wrong clock for C-10, so the README treats that as required for a correct “today”.

Goal file mount: host `./data/goal_status.json` at container `/app/data/goal_status.json`. The backend creates `/app/data` on the first successful save. `.env`, `data/goal_status.json`, and both `node_modules/` trees stay untracked.

`DATA_SOURCE`, Jira variables, and `DATABASE_URL` are read once at startup. Process environment wins over `.env`. Sample mode is the default and needs no `.env`. `DATABASE_URL` inside Compose points at `postgres`. A missing `DATABASE_URL` on a Compose start is a startup error, because job runs cannot be stored.

### Tree

```text
docker-compose.yml
README.md
spec/constitution.md
spec/specification.md
spec/plan.md
data/                         gitignored goal file, created on save
frontend/
  Dockerfile
  package.json
  package-lock.json
  src/main.jsx
  src/pages/SprintHealth.jsx
  src/components/GoalStatusFieldset.jsx
  src/components/AttentionList.jsx
  src/api/sprint-health-api.js
  src/styles/global.css
  test/api/sprint-health-api.test.js
backend/
  Dockerfile
  package.json
  package-lock.json
  src/server.js
  src/config.js
  src/routes/sprint-health.js
  src/routes/goal-status.js
  src/services/decimal-amount.js
  src/services/eligibility.js
  src/services/points-versus-time.js
  src/services/attention-lists.js
  src/services/sprint-health.js
  src/services/goal-status.js
  src/services/record-job-run.js
  src/clients/jira-client.js
  src/db/migrations/001_create_job_runs.sql
  src/db/queries/job-runs.js
  src/db/migrate.js
  test/                         mirrors src/
  sample/sprint.json
  sample/fixtures/              one JSON file per FR-045 case
```

Routes call services and set status codes. Services own rules. `jira-client.js` is the only module that speaks HTTP to Jira. SQL lives in `backend/src/db/`. The frontend imports nothing from `backend/`.

## Behavior contract

### Job runs

`001_create_job_runs.sql` creates `job_runs`:

| Column | Contents |
| --- | --- |
| `id` | Identity |
| `started_at`, `finished_at` | Timestamps |
| `source` | `sample` or `live` |
| `page_state` | The six page states |
| `sprint_name`, `as_of_date`, `points_label` | Null on the four error states |
| `committed_points`, `done_points` | Decimal totals, null when points were not computed |
| `blocked_count`, `overdue_count`, `unassigned_count`, `overloaded_count` | Null when `attention` is null |
| `error_code`, `http_status` | Null on success |

The row stores no token, email, site URL, summary, description, or issue payload. Insert happens after the snapshot is computed and before the response is sent. If the insert fails, `GET /api/sprint-health` returns 500 and the goal file is unchanged.

### Goal file

Path `/app/data/goal_status.json`, UTF-8, one object. A missing, empty, or unreadable file displays On track and is not written. Extra keys are ignored when `status` is exactly `on_track`, `at_risk`, or `off_track`. Any other token, including whitespace around the token, displays On track and is not written.

Save writes a unique temporary file in the same directory, flushes it, then replaces the target. The replace must succeed on Windows and on Linux. The stored object is rewritten as `{ "status": "<token>" }` only. The same token again is a successful replace. An invalid body returns 400 `{ "error": "invalid_status" }` and does not touch the file. A failed first save returns 500 `{ "error": "save_failed", "status": "on_track", "label": "On track" }` and does not create the target. A failed later save returns the previous token. The file is not keyed by sprint. The control shows the stored value with no staleness warning.

### Rules

- Counted types after trim, case-insensitive: `story`, `bug`, `task`. `parent` set does not exclude them. Every other type is excluded before sums and lists.
- Done means status category Done. Match the trimmed name `Done`, `In Progress`, or `To Do`, or the key `done`, `indeterminate`, or `new`.
- Sums, the median, the threshold, and percents use the decimal helper. Half-up to one decimal is display-only. The band uses the exact gap.
- Elapsed percent: 0 before the start date; 100 on or after the end date; on a same-day sprint, 100 on or after that day and 0 before it; otherwise `(today − start) / (end − start) × 100`. The start date itself is 0. Worked check: start `2026-10-01`, end `2026-10-11`, today `2026-10-06` → elapsed `50.0`.
- Gap is exact elapsed minus exact completed. On track when `gap <= 0`, At risk when `0 < gap <= 15`, Off track when `gap > 15`. Display `+15.0`, `-11.1`, or `0.0`. A displayed `15.0` can still be Off track. Example: start `2026-10-01`, end `2026-10-04`, today `2026-10-02`, completed `18.3` → elapsed `33.3`, gap display `15.0`, label Off track.
- Zero committed points and both dates present: completed `100.0`, band from the gap. Zero committed points and a bad date: `dates_unavailable`, `label` null, totals still returned.
- Overloaded groups by `assigneeAccountId`. Display name blank uses “Unassigned”. Open points must be `> 1.5 × median` and `>= 5`. Empty person set: Overloaded count 0, median not computed.
- Issue keys sort by UTF-16 code unit, ascending. Overloaded sorts by exact open points descending, then display name with `en` base sensitivity. The screen does not sort again.
- Linked keys on a blocked row sort ascending and follow `Blocked by`.
- Issue points and open points render with trailing zeros stripped (`0.5`, `5`, `0`). Median, threshold, and percents render as one decimal. The em dash is U+2014.

### Default sample

`backend/sample/sprint.json` contains no tokens, emails, or URLs. For injected today `2026-10-01` the page is On track.

| Field | Value |
| --- | --- |
| Name | Sample Sprint |
| Goal | Ship the health page. |
| Start | 2026-10-01 |
| End | 2026-10-15 |

| Key | Type | Category | Points | Assignee | Due | Flag |
| --- | --- | --- | --- | --- | --- | --- |
| SAM-1 | Story | In Progress | 5 | Ada | 2026-09-30 | true |
| SAM-2 | Bug | To Do | 3 | none | null | false |
| SAM-3 | Task | Done | 2 | Bo | null | false |
| SAM-4 | Story | In Progress | 8 | Ada | null | false |

On `2026-10-01`: committed 18, done 2, completed `11.1`, elapsed `0.0`, gap display `-11.1`, label On track. SAM-1 is on Blocked and Overdue. SAM-2 is on Unassigned. Overloaded is empty because only Ada has open points. The running server uses the process date, so this band is the fixture check, not a promise about the wall clock.

`backend/sample/fixtures/` holds separate files for the other bands, an even load, one issue on two lists, a subtask under a counted story, a done issue, null points, no due date, a whitespace goal, and flag-only, status-only, link-only, and flag-plus-link. Those files are not the default page.

### Live Jira

Both calls are GET, basic auth, certificate checks left on, timeout 10 seconds.

| Call | Path |
| --- | --- |
| Active sprints | `/rest/agile/1.0/board/{boardId}/sprint?state=active` |
| Sprint issues | `/rest/agile/1.0/sprint/{sprintId}/issue` |

The issue call requests `summary`, `issuetype`, `status`, `assignee`, `duedate`, `parent`, `flagged`, `issuelinks`, and the story-point field. It does not request comments, attachments, or description. Page with `maxResults=50` until the sprint is loaded. A later page failure discards issues already read and returns `source_error`.

Before any sprint call, the client resolves the story-point field with GET `/rest/api/3/field`. The accepted names are `Story Points` and `Story point estimate`. Any other numeric field is ignored. If neither name exists, every live issue has null points and the snapshot still loads.

Mapper defaults when the sprint array and the issue array are readable:

| Bad field | Result |
| --- | --- |
| Points missing, non-numeric, or negative | Null on the model for non-numeric; negative stays a number for display and adds zero |
| Flag missing or not Impediment | `flagged` false |
| Links missing | `blockedByKeys` null |
| Due date unparseable | null |
| One issue missing a key | That issue is skipped |
| Sprint array or issue array unreadable | `source_error` for the whole snapshot |

`parentSet` is true only when `fields.parent` is present. The classic epic-link field does not set it.

Status category uses `name` when it matches, otherwise `key` (`done`, `indeterminate`, `new`).

A blocked-by link is an `issuelinks` entry whose inward description matches `is blocked by` after trim, case-insensitive, and whose `inwardIssue.key` is the blocker. An outward “blocks” link alone does not match. A matching link with no key yields the empty-list signal.

Config, checked before any Jira call, first failure wins:

- Empty or unset is missing.
- `JIRA_SITE_URL` must be an HTTPS origin with no userinfo, path, query, or hash. One trailing slash is removed before that check. `http` and a path are `missing_config` for `JIRA_SITE_URL`.
- `JIRA_BOARD_ID` must be a positive integer string.
- `DATA_SOURCE` other than `sample` or `live`, a missing sample file, and invalid sample JSON exit the process with code 1 and the path or variable name on stderr.

`httpStatus` is the Jira status when a response arrived, otherwise null. DNS, timeout, and TLS failures are `source_error` with `httpStatus` null.

### Screen

Heading pattern is `Blocked (2)`. The empty sentence is `Nothing needs attention.` Status words are `On track`, `At risk`, and `Off track`.

| Sentence | When |
| --- | --- |
| The goal is not set. | Goal text is null or whitespace, on every page state |
| Sprint dates are unavailable. | `dates_unavailable` |
| This board has no active sprint. | `no_active_sprint` |
| This board has more than one active sprint. | `multiple_active_sprints` |
| Missing configuration: JIRA_SITE_URL. | `missing_config`, using the first missing name |
| The sprint could not be loaded. | `source_error`, `GET` 500, or a failed fetch. Append ` HTTP 404.` when `httpStatus` is set |
| The goal status was not saved. | Save 400 or 500 |
| Loading the sprint. | Live request in flight. No issue rows yet |

| `pageState` | Regions |
| --- | --- |
| `ready` | All seven. Percents and signed gap. Lists in order. |
| `dates_unavailable` | Identity shows any date that parsed. Region 2 is the dates sentence and no percents. Goal and four lists still render. `committedPoints` and `donePoints` are present. `label`, `completedPercent`, `elapsedPercent`, `gap`, and `gapDisplay` are null. |
| `no_active_sprint`, `multiple_active_sprints`, `missing_config`, `source_error` | `sprint`, `pointsVersusTime`, and `attention` are null. Summary shows the error sentence and “The goal is not set.” The goal control shows the saved status. Lists are omitted. |

The goal control is a fieldset with legend `Sprint goal status` and three radios. Choosing a different radio saves immediately. Color may reinforce a label and is never the only signal.

## Phases and milestones

The build has four phases. A phase starts only after the previous milestone passes. Phase 3 finishes one feature before the next feature starts. Each feature brings the tests that lock its rules. Phase 4 runs those tests together on the Compose stack and does the manual browser check.

This version has one screen, so Phase 2 does not add a client-side router package. React, Vite, and Express already serve one page at `/` and proxy `/api`. A router library would need a justification this version does not have.

### Phase 1: Backend setup (database, API skeleton)

Create the backend tree, PostgreSQL, and the HTTP skeleton. No health rules and no Jira calls in this phase.

- Pin the backend to Node.js 24.21.0, Express 5.2.1, and `pg` 8.23.1. Commit `backend/package-lock.json`.
- Add the backend Dockerfile and the `postgres` and `backend` services in Compose. Publish `127.0.0.1:3000` and `127.0.0.1:5432`. Pass `TZ` into the backend. Mount `./data` at `/app/data`.
- Add `001_create_job_runs.sql`, `backend/src/db/migrate.js`, and `backend/src/db/queries/job-runs.js`. The backend runs migrations before it listens. `postgres` has a healthcheck, and the backend waits for it.
- Add `server.js`, `config.js`, and route files that return the response shapes without computing a sprint:
  - `GET /api/sprint-health` returns `200` with `pageState: "ready"`, `source: "sample"`, empty attention lists, and `goalStatus` of `on_track`.
  - `POST /api/goal-status` returns `400` `{ "error": "invalid_status" }` for every body.
- Read `DATA_SOURCE` and `DATABASE_URL` once at startup. Missing `DATABASE_URL` exits 1. Sample mode still needs no `.env` once Compose injects `DATABASE_URL`.
- Ignore unknown query parameters, including a sprint id.
- Replace the calculator README with the API port, `TZ`, the Jira variable names, the goal-file path, and the three tokens. Point it at `project_spec.md`.

**Milestone M1 — Backend skeleton.** `docker compose up` starts PostgreSQL and the backend. The migration has created `job_runs`. `GET /api/sprint-health` returns the stub `200`. `POST /api/goal-status` returns `400`. The process opens no socket to Atlassian.

### Phase 2: Frontend setup (UI skeleton, routing)

Create the frontend tree and one route. The page renders the stub from Phase 1. It does not format bands or lists yet.

- Pin React 18.3.1, React DOM 18.3.1, and Vite 8.3.4. Commit `frontend/package-lock.json`.
- Add the frontend Dockerfile. The image runs `vite build`, then `vite preview`, listening on `0.0.0.0:5173`. Compose publishes `127.0.0.1:5173`.
- Route `/` to `SprintHealth.jsx`. Proxy `/api` to `http://backend:3000`. There is no second page and no router dependency.
- Lay out the seven regions in order with placeholder text: sprint identity, points versus time, sprint goal, Blocked, Overdue, Unassigned, Overloaded. Include the fieldset and three disabled radios.
- `frontend/src/api/sprint-health-api.js` calls `GET /api/sprint-health` and `POST /api/goal-status`. The page shows “The sprint could not be loaded.” when that GET fails.
- Add `frontend/test/api/sprint-health-api.test.js` for the request shapes only.

**Milestone M2 — UI skeleton.** The manager opens `http://127.0.0.1:5173` and sees the seven regions filled from the stub JSON. The browser calls only this backend. Refresh hits `/` again and requests `/api/sprint-health` again.

### Phase 3: Feature implementation (one feature at a time)

Finish each feature, including its tests, before starting the next. The screen starts showing real data only for the feature that is done. Later features must not change the rules of an earlier one.

#### Feature 1 — Sample sprint snapshot

Sprint identity and points versus time, from `backend/sample/sprint.json`, for user story 1’s summary.

- Add the decimal helper, eligibility, and points-versus-time. Rules take an injected `today`. The server passes the process calendar date.
- Add the default sample file. It contains no tokens, emails, or URLs. The `2026-10-01` check in this plan is the fixture assertion.
- `GET /api/sprint-health` in sample mode returns `ready` or `dates_unavailable` from those rules. `committedPoints` and `donePoints` are present. The band comes from `label`.
- Record one `job_runs` row for the GET. A failed insert returns 500 and does not write the goal file.
- A bad `DATA_SOURCE`, a missing sample file, or invalid sample JSON exits 1.

**Milestone M3.1 — Snapshot.** With today injected as `2026-10-01`, the sample GET is On track, elapsed `0.0`, completed `11.1`, gap display `-11.1`. Missing, inverted, and same-day dates match the behavior contract. The page shows sprint name, dates, today, and the points sentence. Attention headings still show the stub empty lists.

#### Feature 2 — Attention lists

The four lists, still in sample mode.

- Implement Blocked, Overdue, Unassigned, and Overloaded, including sort, signals, and the em dash.
- Add the FR-045 fixtures under `backend/sample/fixtures/`. They are not served as the default page.
- The GET returns the four list objects. `count` equals `rows.length`. Headings use `Blocked (2)`. An empty list says “Nothing needs attention.”

**Milestone M3.2 — Lists.** The sample page shows SAM-1 on Blocked and Overdue, SAM-2 on Unassigned, and Overloaded `(0)`. Fixture tests cover both thresholds, a subtask, a story with a parent, a keyless blocker link, and an issue on two lists. No socket to Atlassian.

#### Feature 3 — Goal status

The only manager write. User story 2.

- Implement the atomic goal file in `services/goal-status.js`.
- The fieldset legend is `Sprint goal status`. Three radios, one selected. Choosing a different value saves immediately. The selected radio does not have to submit itself again.
- Wire `POST /api/goal-status` to 200, 400, and 500 as specified. Sample and live will share this file.
- The control stays usable on `missing_config` and the other error states. When goal text is absent, the page says “The goal is not set.”

**Milestone M3.3 — Goal judgment.** Set each token, refresh, and restart the backend: the same radio is selected. An invalid body leaves the file unchanged. A missing file shows On track until a successful save. A failed first save does not create the file.

#### Feature 4 — Live Jira board

User stories 3 and 4. Same rules, different source.

- Add `clients/jira-client.js` with the GET paths, field lookup, pagination, and mapper defaults from the behavior contract.
- Preflight the four variables in the fixed order. A missing or invalid value returns `missing_config` and does not call Jira.
- Zero active sprints, more than one active sprint, HTTP errors, timeouts, DNS, TLS, and a failed later page become the error `pageState`s. No sample rows. The goal file is unchanged. The error still inserts a `job_runs` row.
- Live keys link to `{origin}/browse/{key}` in a new tab. Sample keys stay text. The sprint name is not a link.
- The page shows “Loading the sprint.” while the live GET is in flight.

**Milestone M3.4 — Live path.** Stubbed tests show one active sprint under the same band and list rules, and a miss with no invented rows. The default suite still opens no socket to Atlassian.

### Phase 4: Integration and testing

Prove the four features together on Compose. Do not add behavior in this phase. A failure here is fixed in the feature that owns it, then this phase is run again.

- Run the whole Node.js suite against PostgreSQL 15.19 on `127.0.0.1:5432`.
- `docker compose up` with no `.env` serves the sample sprint at `http://127.0.0.1:5173`.
- Log-redaction check: a sample request log may include keys, `pageState`, and `sample`. It must not include summaries, descriptions, emails, tokens, or raw environment values.
- Confirm the token and email are absent from the page, the repo, the logs, and `data/goal_status.json`.
- Re-run the Constitution Check. Any new dependency is recorded in complexity tracking before it is added.
- Manual browser check on current Chrome, Edge, or Firefox, at about 1280 pixels wide:
  - Sample sprint name, both dates, and the backend’s today are visible.
  - Points label and goal status are both text.
  - Four headings remain when a list is empty.
  - Changing the goal radio, refreshing, and restarting the backend keeps the selection.
  - Sample keys are not links.
  - The summary is readable before the lists for the default one-line goal.

**Milestone M4 — Version done.** SC-001 through SC-010 hold. Sample mode needs no Jira site. Live mode is implemented behind `DATA_SOURCE=live`. `docker compose down` stops the frontend, the backend, and PostgreSQL, and no other service remains.

## Automated tests

Node.js test runner only. Tests for a feature are written in that feature’s step in Phase 3. Phase 4 runs the full set. Database tests use `127.0.0.1:5432` and PostgreSQL 15.19. Rule tests do not need the database.

| Feature | Cases |
| --- | --- |
| Snapshot | Equal percents; gap just above 0; exact 15; displayed 15.0 that is Off track; negative gap; zero commitment; same-day sprint; start date is 0 elapsed; missing start; missing end; unparseable date; end before start; zero commitment with a missing date |
| Lists | Flag, status, link, flag-plus-link, keyless link, outward “blocks” only, overdue yesterday versus today, missing due date, unassigned, display name “Unassigned” on a real account, issue on two lists, empty list copy, Sub-task, Subtask, story with parent, User Story, epic, done issue in the totals and off the issue lists, null, non-numeric, negative, zero, `0.5`, both overload thresholds, equality on 1.5×, 4.9 points, one person, even load, two account ids with the same display name |
| Goal status | Missing, empty, extra keys, illegal token, successful save, same-token rewrite, failed replace, restart |
| Live board | GET only, missing config does not call, six page states, ignored sprint id query, pagination abort, mapper defaults, no token in errors |
| Job runs | One row per GET, error row has no secrets, insert failure returns 500 |
| Frontend client | POST body `{ "status": "at_risk" }`. The client file contains no band formula |

Dropping a test to make the suite pass is forbidden.

## Out of this plan

Confluence reads and writes, Jira issue edits, a board switcher, sprint history charts, a goal-status staleness warning, a second backend process, and a hosted multi-user deployment. Those need a new spec before a new phase.
