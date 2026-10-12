# Tasks: Sprint Health Dashboard

**Source**: `spec/plan.md`

**Branch**: `001-sprint-health-dashboard`

Work in order. A task starts only after the tasks it depends on are done. Phase 3 finishes Feature 1 before Feature 2, then Feature 3, then Feature 4. Behavior and its tests land in the same task. Do not drop a test to make a suite pass.

Rules, copy, ports, and the sample sprint are the behavior contract in `spec/plan.md`. These tasks do not add a second product, a Confluence client, a client-side router, or a second copy of the goal judgment in PostgreSQL.

## Task index

| Task | Title | Milestone |
| --- | --- | --- |
| T1.1 | Pin the backend | M1 |
| T1.2 | Run PostgreSQL and the backend in Compose | M1 |
| T1.3 | Create `job_runs` and migrate on boot | M1 |
| T1.4 | Load configuration once | M1 |
| T1.5 | Stub the two API routes | M1 |
| T1.6 | Replace the README and ignore local files | M1 |
| T2.1 | Pin the frontend | M2 |
| T2.2 | Serve the frontend and proxy `/api` | M2 |
| T2.3 | Render the seven-region skeleton | M2 |
| T2.4 | Call the stub API | M2 |
| T3.1.1 | Add decimal arithmetic | M3.1 |
| T3.1.2 | Decide which issues count | M3.1 |
| T3.1.3 | Compute points versus time | M3.1 |
| T3.1.4 | Add the default sample sprint | M3.1 |
| T3.1.5 | Return the sample snapshot | M3.1 |
| T3.1.6 | Store each snapshot load | M3.1 |
| T3.1.7 | Fail startup on a bad sample setup | M3.1 |
| T3.1.8 | Show sprint identity and the points signal | M3.1 |
| T3.2.1 | Build the Blocked list | M3.2 |
| T3.2.2 | Build the Overdue list | M3.2 |
| T3.2.3 | Build the Unassigned list | M3.2 |
| T3.2.4 | Build the Overloaded list | M3.2 |
| T3.2.5 | Serve the lists on the sample page | M3.2 |
| T3.3.1 | Store the goal status in the host file | M3.3 |
| T3.3.2 | Accept the goal-status POST | M3.3 |
| T3.3.3 | Save from the goal fieldset | M3.3 |
| T3.4.1 | Reject a bad live configuration before calling Jira | M3.4 |
| T3.4.2 | Map one active sprint from Jira | M3.4 |
| T3.4.3 | Return live errors without sample rows | M3.4 |
| T3.4.4 | Link live keys and show the waiting sentence | M3.4 |
| T4.1 | Run the full automated suite | M4 |
| T4.2 | Boot the sample stack with no `.env` | M4 |
| T4.3 | Check logs and secrets | M4 |
| T4.4 | Walk the page in a browser | M4 |

## Phase 1: Backend setup (database, API skeleton)

No health rules and no Jira calls in this phase.

### T1.1 Pin the backend

**Depends on:** none

Create `backend/package.json` and `backend/package-lock.json` for Node.js 24.21.0, Express 5.2.1, and `pg` 8.23.1. The test script uses the Node.js test runner.

**Acceptance criteria:**

- The lockfile is committed and pins Express 5.2.1 and `pg` 8.23.1.
- `node --test` runs, with zero tests allowed at this step.
- No other HTTP or database package is added.

### T1.2 Run PostgreSQL and the backend in Compose

**Depends on:** T1.1

Add `backend/Dockerfile` from `node:24.21.0` and root `docker-compose.yml` services `postgres` and `backend`.

**Acceptance criteria:**

- `postgres` uses `postgres:15.19`, has a healthcheck, and publishes `127.0.0.1:5432`.
- `backend` publishes `127.0.0.1:3000`, listens on `0.0.0.0:3000` inside the container, and starts only after `postgres` is healthy.
- Compose sets `DATABASE_URL` to the `postgres` service and passes host `TZ` into the backend.
- Host `./data` is mounted at `/app/data`.
- `docker compose up` reaches a listening backend. `docker compose down` removes those two containers.

### T1.3 Create `job_runs` and migrate on boot

**Depends on:** T1.2

Add `backend/src/db/migrations/001_create_job_runs.sql`, `backend/src/db/migrate.js`, and `backend/src/db/queries/job-runs.js`. Run migrations before the process listens.

**Acceptance criteria:**

- `job_runs` has `id`, `started_at`, `finished_at`, `source`, `page_state`, `sprint_name`, `as_of_date`, `points_label`, `committed_points`, `done_points`, `blocked_count`, `overdue_count`, `unassigned_count`, `overloaded_count`, `error_code`, and `http_status`.
- The table has no column for a token, email, site URL, summary, description, or issue payload.
- A second boot does not fail when the migration has already been applied.
- SQL lives only under `backend/src/db/`.

### T1.4 Load configuration once

**Depends on:** T1.2

Add `backend/src/config.js`. Read `DATA_SOURCE`, `DATABASE_URL`, `TZ`, and the four `JIRA_*` variables once at process start. A variable already set in the process environment wins over the same key in `.env`.

**Acceptance criteria:**

- Unset `DATA_SOURCE` means `sample`.
- The loader reports `DATA_SOURCE` exactly as read. T3.1.7 exits when that value is not `sample` or `live`.
- Missing `DATABASE_URL` prints the variable name to stderr and exits 1.
- `Live` and `SAMPLE` are not treated as `live` or `sample`.

### T1.5 Stub the two API routes

**Depends on:** T1.3, T1.4

Add `backend/src/server.js`, `backend/src/routes/sprint-health.js`, and `backend/src/routes/goal-status.js`. Routes call a service function and set the status code. They do not contain SQL or Jira calls.

**Acceptance criteria:**

- `GET /api/sprint-health` returns 200 with `pageState` `ready`, `source` `sample`, `goalStatus.status` `on_track`, `goalStatus.label` `On track`, and four attention objects whose `count` is 0 and whose `rows` are empty.
- `POST /api/goal-status` returns 400 `{ "error": "invalid_status" }` for every body, including a valid token.
- `GET /api/sprint-health?sprintId=9` returns the same stub as a request with no query string.
- A request log for this stub does not print environment values.
- The process opens no socket to Atlassian.

### T1.6 Replace the README and ignore local files

**Depends on:** T1.5

Replace the calculator README. Update `.gitignore`.

**Acceptance criteria:**

- The README states `http://127.0.0.1:3000` for the API, tells the operator to set `TZ` to the host IANA zone, lists `JIRA_SITE_URL`, `JIRA_BOARD_ID`, `JIRA_EMAIL`, and `JIRA_API_TOKEN`, states that the token is read-only, states the goal path `data/goal_status.json` and the tokens `on_track`, `at_risk`, and `off_track`, and points at `project_spec.md` for the product rules.
- `.gitignore` covers `.env`, `data/goal_status.json`, `frontend/node_modules/`, and `backend/node_modules/`.
- **Milestone M1:** `docker compose up` starts PostgreSQL and the backend, `job_runs` exists, the stub GET returns 200, and the stub POST returns 400.

## Phase 2: Frontend setup (UI skeleton, routing)

The page shows the Phase 1 stub. It does not format bands or lists yet. Do not add a router package.

### T2.1 Pin the frontend

**Depends on:** M1

Create `frontend/package.json` and `frontend/package-lock.json` for React 18.3.1, React DOM 18.3.1, and Vite 8.3.4.

**Acceptance criteria:**

- The lockfile is committed and pins those three packages.
- No router, data-fetching framework, or CSS framework is added.

### T2.2 Serve the frontend and proxy `/api`

**Depends on:** T2.1

Add `frontend/Dockerfile` and the `frontend` Compose service. Vite builds, then `vite preview` listens on `0.0.0.0:5173`. Compose publishes `127.0.0.1:5173`. Proxy `/api` to `http://backend:3000` for both the dev server and preview.

**Acceptance criteria:**

- `http://127.0.0.1:5173` loads the frontend.
- A browser request to `/api/sprint-health` is served by the backend stub and does not require CORS.
- The frontend image uses `node:24.21.0`.

### T2.3 Render the seven-region skeleton

**Depends on:** T2.2

Add `frontend/src/main.jsx`, `frontend/src/pages/SprintHealth.jsx`, `frontend/src/components/GoalStatusFieldset.jsx`, `frontend/src/components/AttentionList.jsx`, and `frontend/src/styles/global.css`. `/` renders `SprintHealth`. There is no second page.

**Acceptance criteria:**

- Document order is sprint identity, points versus time, sprint goal, Blocked, Overdue, Unassigned, Overloaded.
- Each region is visible with placeholder text before the stub JSON arrives.
- The goal control is a fieldset with legend `Sprint goal status` and three disabled radios labeled On track, At risk, and Off track.
- Component files use PascalCase and export the matching component. CSS classes use kebab-case.
- `frontend/` does not import from `backend/`.

### T2.4 Call the stub API

**Depends on:** T2.3

Add `frontend/src/api/sprint-health-api.js` and `frontend/test/api/sprint-health-api.test.js`. The page fills the seven regions from `GET /api/sprint-health`.

**Acceptance criteria:**

- The client requests `GET /api/sprint-health` and can POST `{ "status": "at_risk" }` to `/api/goal-status`.
- The client file contains no band, gap, or median formula.
- When the GET fails, the page shows “The sprint could not be loaded.” and no issue rows.
- The Node.js test asserts the POST body and path.
- **Milestone M2:** Opening `http://127.0.0.1:5173` shows the seven regions from the stub. Refresh requests `/api/sprint-health` again. The browser does not call Jira.

## Phase 3: Feature implementation (one feature at a time)

### Feature 1 — Sample sprint snapshot

#### T3.1.1 Add decimal arithmetic

**Depends on:** M2

Add `backend/src/services/decimal-amount.js` and `backend/test/services/decimal-amount.test.js`. No new package.

**Acceptance criteria:**

- Addition and division of `0.1` and `0.2` do not use IEEE results.
- Half-up to one decimal place formats `100` as `100.0`, `0` as `0.0`, and a value just above `15` that rounds to `15.0` as `15.0`.
- The exact value remains available for comparison after display rounding.

#### T3.1.2 Decide which issues count

**Depends on:** T3.1.1

Add `backend/src/services/eligibility.js` and its test.

**Acceptance criteria:**

- After trim, `Story`, `Bug`, and `Task` count, in any letter case, even when `parent` is set.
- `Sub-task`, `Subtask`, `User Story`, `Epic`, and any other type are excluded.
- Done matches the trimmed category name `Done` or the key `done`. `In Progress` / `indeterminate` and `To Do` / `new` are not done.
- A status named Done whose category is not Done is not done.

#### T3.1.3 Compute points versus time

**Depends on:** T3.1.2

Add `backend/src/services/points-versus-time.js` and its test. The function takes an injected `today`.

**Acceptance criteria:**

- Start `2026-10-01`, end `2026-10-11`, today `2026-10-06` yields elapsed `50.0`.
- Today before the start date yields elapsed `0.0`. Today on the start date yields elapsed `0.0`. Today on or after the end date yields elapsed `100.0`.
- A same-day sprint is `100.0` on or after that day and `0.0` before it, and the test does not divide by zero.
- Gap `<= 0` is On track, `0 < gap <= 15` is At risk, and `gap > 15` is Off track. The band uses the exact gap.
- Start `2026-10-01`, end `2026-10-04`, today `2026-10-02`, completed `18.3` yields elapsed display `33.3`, gap display `15.0`, and label Off track.
- Committed points of zero with both dates present yield completed `100.0` and a band from the gap.
- A null, empty, unparseable, or end-before-start date yields no elapsed percent and no label. Zero committed points do not force On track in that case.
- A negative point value adds zero. A stored zero adds zero. `0.5` is summed as a fraction. Null and non-numeric points add zero.
- A done counted issue stays in committed points and done points.

#### T3.1.4 Add the default sample sprint

**Depends on:** T3.1.3

Add `backend/sample/sprint.json` with the Sample Sprint from the plan: goal `Ship the health page.`, start `2026-10-01`, end `2026-10-15`, and issues SAM-1 through SAM-4.

**Acceptance criteria:**

- The file contains no token, email, or URL.
- For injected today `2026-10-01` the totals are committed 18 and done 2, completed `11.1`, elapsed `0.0`, gap display `-11.1`, and label On track.
- SAM-3 is done and remains in the totals.

#### T3.1.5 Return the sample snapshot

**Depends on:** T3.1.4

Replace the stub body of `GET /api/sprint-health` in sample mode. Add `backend/src/services/sprint-health.js`. Attention lists stay empty until Feature 2. The route still ignores a sprint id query parameter.

**Acceptance criteria:**

- Sample mode reads `backend/sample/sprint.json` and returns `pageState` `ready` when both dates parse.
- The JSON includes `asOfDate`, sprint name, start, end, goal text, `pointsVersusTime.label`, both percents, `gap`, `gapDisplay`, `committedPoints`, and `donePoints`.
- `label` is the band. `gap` is the exact value. `gapDisplay` is the signed one-decimal string, with a leading `+` when the gap is positive, a leading `-` when it is negative, and `0.0` when it is zero.
- A sprint with a missing date returns `pageState` `dates_unavailable`, a null label, null percents, null gap fields, and the committed and done totals.
- The running server passes the process calendar date in `TZ`. Tests pass a fixed `today`.

#### T3.1.6 Store each snapshot load

**Depends on:** T3.1.5

Call `record-job-run` from the sprint-health path after the snapshot is computed and before the response is sent.

**Acceptance criteria:**

- One `job_runs` row is inserted per GET, with source, page state, sprint name, as-of date, points label, and point totals.
- The row has no token, email, site URL, summary, or issue payload.
- When the insert fails, the GET returns 500 and `data/goal_status.json` is not created or changed.
- A database test runs against PostgreSQL 15.19.

#### T3.1.7 Fail startup on a bad sample setup

**Depends on:** T3.1.5

**Acceptance criteria:**

- `DATA_SOURCE=livee`, a missing `backend/sample/sprint.json`, and sample JSON that is not an object each print a clear file or value error to stderr and exit 1.
- The message does not include a token or email.
- Unset `DATA_SOURCE` still starts in sample mode.

#### T3.1.8 Show sprint identity and the points signal

**Depends on:** T3.1.5

Fill regions 1 and 2 from the API. Leave the four list headings on the empty stub until Feature 2.

**Acceptance criteria:**

- The page shows the sprint name, start, end, and `asOfDate` as `YYYY-MM-DD`.
- The points region shows the label, both percents, and `gapDisplay` from the API. The browser does not recompute them.
- For `dates_unavailable`, region 2 shows “Sprint dates are unavailable.” and no percent.
- A missing or whitespace `goalText` shows “The goal is not set.” in region 3.
- **Milestone M3.1:** The injected `2026-10-01` sample response is On track with gap display `-11.1`. The page shows that identity and points sentence.

### Feature 2 — Attention lists

#### T3.2.1 Build the Blocked list

**Depends on:** M3.1

Add the Blocked rule to `backend/src/services/attention-lists.js` and its test.

**Acceptance criteria:**

- A not-done counted issue is included when `flagged` is true, the status name is `Blocked` in any case, or `blockedByKeys` is an array.
- `blockedByKeys` null does not match. An empty array matches, and the signal text is `Blocked by` with no key.
- Signals appear once, in the order Flagged, `Status: Blocked`, then `Blocked by` plus keys sorted ascending.
- An outward “blocks” link alone does not match. A done issue and an excluded type do not appear.
- The issue appears once. Rows sort by key using UTF-16 code units, ascending.

#### T3.2.2 Build the Overdue list

**Depends on:** T3.2.1

**Acceptance criteria:**

- A not-done counted issue is included only when its due date is a calendar date before `today`.
- Today, a future date, null, empty, and unparseable due dates are absent.
- The row’s `dueDate` is `YYYY-MM-DD`.
- A parent does not receive a subtask’s due date.
- Sort is by key, ascending, not by how late the issue is.

#### T3.2.3 Build the Unassigned list

**Depends on:** T3.2.1

**Acceptance criteria:**

- A not-done counted issue with no account id and no display name is included.
- An account id with a blank display name is not on this list.
- A display name of `Unassigned` on an account that has an id is not on this list.
- A done issue with no assignee is absent, and its points stay in the commitment when it is a counted type.
- An issue with null points is still listed. `storyPoints` is null.

#### T3.2.4 Build the Overloaded list

**Depends on:** T3.1.1, T3.2.1

**Acceptance criteria:**

- People are grouped by `assigneeAccountId`. Open points are the decimal sum of story points on that person’s not-done counted issues.
- A person is included only when open points are greater than `1.5 × median` and at least 5. Equality on the median test is excluded. `4.9` is excluded.
- The median is the middle value for an odd count and the average of the two middle values for an even count. People with zero open points are left out. One person yields an empty list.
- Two account ids with the same display name stay two people.
- A blank display name is rendered as `Unassigned` on the row and does not put that person on the Unassigned issue list.
- Rows sort by exact open points descending, then display name with `en` base sensitivity.
- `median` and `threshold` in the API are exact. Their display fields are half-up to one decimal and are rounded only in the backend.

#### T3.2.5 Serve the lists on the sample page

**Depends on:** T3.2.2, T3.2.3, T3.2.4

Add the FR-045 fixtures under `backend/sample/fixtures/`. Return the four lists from the sample GET. Render them with `AttentionList.jsx`.

**Acceptance criteria:**

- Fixtures exist for the other bands, an even load, one issue on two lists, a subtask under a counted story, a done issue, null points, no due date, a whitespace goal, flag-only, status-only, link-only, and flag-plus-link. None of those files is the default page. None contains a token, email, or URL.
- Each list object has `count === rows.length`. Headings render as `Blocked (1)`, `Overdue (1)`, `Unassigned (1)`, and `Overloaded (0)` for the default sample on `2026-10-01`.
- SAM-1 appears on Blocked and Overdue and not twice on either list. SAM-2 appears on Unassigned. Overloaded says “Nothing needs attention.”
- A missing point renders as the em dash U+2014. A stored zero renders as `0`. A negative point renders as that number. Open points render with trailing zeros stripped.
- Issue rows show key, summary, assignee or `Unassigned`, and points. They do not show description, comments, or labels.
- The screen does not sort the rows again.
- **Milestone M3.2:** The checks above pass with no socket to Atlassian.

### Feature 3 — Goal status

#### T3.3.1 Store the goal status in the host file

**Depends on:** M3.2

Add `backend/src/services/goal-status.js` and its test. The only path is `/app/data/goal_status.json` in the container, which is host `./data/goal_status.json`.

**Acceptance criteria:**

- A missing, empty, or unreadable file, and a token other than the three exact values, reads as On track and does not write the file.
- Extra keys are ignored when `status` is exactly `on_track`, `at_risk`, or `off_track`. Whitespace inside the token is not valid.
- A successful save writes a unique temporary file in the same directory, flushes it, and replaces the target on Windows and on Linux. The stored object is only `{ "status": "<token>" }`.
- Saving the same token again replaces the file and succeeds.
- A failed first save does not create the target and reports previous status `on_track`. A failed later save leaves the previous file in place.
- The file is not keyed by sprint, board, or source, and it contains no token, email, site URL, or issue payload.

#### T3.3.2 Accept the goal-status POST

**Depends on:** T3.3.1

Replace the stub `POST /api/goal-status`.

**Acceptance criteria:**

- `{ "status": "at_risk" }` returns 200 `{ "status": "at_risk", "label": "At risk" }` after the file is replaced.
- The same mapping holds for `on_track` / On track and `off_track` / Off track.
- An unknown value, including the display words, returns 400 `{ "error": "invalid_status" }` and leaves the file unchanged.
- A failed replace returns 500 `{ "error": "save_failed", "status": "<previous>", "label": "<previous label>" }`.
- `GET /api/sprint-health` returns the saved status in sample mode.

#### T3.3.3 Save from the goal fieldset

**Depends on:** T3.3.2

Enable the three radios. Choosing a different radio POSTs immediately.

**Acceptance criteria:**

- Exactly one radio is selected. All three labels stay visible. The control is not a text box.
- After a 200, the returned choice is selected. Refresh and a backend restart still show it.
- A 400 or 500 shows “The goal status was not saved.” and keeps the previous selection.
- Clicking the already selected radio is not required to save again.
- When `goalText` is null or whitespace, the page shows “The goal is not set.” and the radios still save.
- The goal text is plain text, is not truncated, preserves newlines, and is not inserted as HTML.
- **Milestone M3.3:** Each of the three tokens survives refresh and backend restart. A missing file starts at On track and stays unwritten until a successful save.

### Feature 4 — Live Jira board

#### T3.4.1 Reject a bad live configuration before calling Jira

**Depends on:** M3.3

Check live variables only when `DATA_SOURCE=live`, in this order: `JIRA_SITE_URL`, `JIRA_BOARD_ID`, `JIRA_EMAIL`, `JIRA_API_TOKEN`.

**Acceptance criteria:**

- Empty and unset count as missing. The first missing or invalid variable is the only `error.missingVariable`.
- The page shows `Missing configuration: ` plus that name, no issue rows, and no secret. The goal control still shows the saved status and POST still works.
- `JIRA_SITE_URL` must be an HTTPS origin. One trailing slash is removed first. A userinfo, path, query, hash, or `http` scheme fails as `JIRA_SITE_URL`.
- `JIRA_BOARD_ID` must be a positive integer string.
- Jira is not called. In sample mode the four variables are ignored even when they are set.
- The message contains the variable name and not the variable value.

#### T3.4.2 Map one active sprint from Jira

**Depends on:** T3.4.1

Add `backend/src/clients/jira-client.js` and a stubbed test. This is the only module that sends HTTP to Jira.

**Acceptance criteria:**

- The client sends GET `/rest/agile/1.0/board/{boardId}/sprint?state=active`, GET `/rest/api/3/field`, and GET `/rest/agile/1.0/sprint/{sprintId}/issue` with basic auth, certificate checks left on, and a 10-second timeout.
- Issue requests ask for `summary`, `issuetype`, `status`, `assignee`, `duedate`, `parent`, `flagged`, `issuelinks`, and the story-point field. They do not ask for comments, attachments, or description.
- Story points come from a field named `Story Points` or `Story point estimate`. Any other numeric field stays null. If neither name exists, points are null and the snapshot still loads.
- Pages of 50 are followed until the sprint is loaded. A later page failure discards issues already read.
- `parentSet` follows `fields.parent` only.
- The impediment flag sets `flagged`. A missing flag is false.
- A link whose inward description matches `is blocked by` after trim, case-insensitive, contributes `inwardIssue.key`. A matching link with no key yields an empty `blockedByKeys` array. Missing links yield null.
- A date-only string stays that date. A datetime becomes the calendar date in `TZ`.
- One issue with no key is skipped. An unreadable sprint array or issue array fails the whole mapping.
- Tests stub HTTP. The default suite opens no socket to Atlassian. Every outbound test request is GET.

#### T3.4.3 Return live errors without sample rows

**Depends on:** T3.4.2

Use the same health rules on the mapped model. Insert a `job_runs` row for success and for these errors.

**Acceptance criteria:**

- One active sprint returns `source` `live` and the same band and list rules as sample mode.
- Zero active sprints return `pageState` `no_active_sprint`, message “This board has no active sprint.”, and null `sprint`, `pointsVersusTime`, and `attention`.
- More than one active sprint returns `pageState` `multiple_active_sprints` and “This board has more than one active sprint.” The response does not choose a sprint.
- An HTTP error, timeout, DNS failure, or TLS failure returns `pageState` `source_error` and “The sprint could not be loaded.” `httpStatus` is the Jira status when a response arrived, and null otherwise. The screen appends ` HTTP 404.` when that status is 404.
- Those error responses include `goalStatus`, do not include sample issues, and do not change the goal file.
- A GET 500 still has no snapshot body.

#### T3.4.4 Link live keys and show the waiting sentence

**Depends on:** T3.4.3

**Acceptance criteria:**

- In live mode each issue key links to the HTTPS origin plus `/browse/` plus the key, with `target="_blank"` and `rel="noopener noreferrer"`.
- In sample mode keys are plain text. The sprint name is not a link in either mode.
- While a live GET is in flight, the page shows “Loading the sprint.” and no issue rows.
- On the four error states the summary shows the error sentence and “The goal is not set.” because there is no goal text, and the goal radios stay usable.
- **Milestone M3.4:** Stubbed tests cover one active sprint, no active sprint, many active sprints, a failed later page, and a missing variable that does not call Jira.

## Phase 4: Integration and testing

Do not add behavior in this phase. A failure is fixed in the task that owns it, then this phase is run again.

### T4.1 Run the full automated suite

**Depends on:** M3.4

**Acceptance criteria:**

- `node --test` for the backend and the frontend API client passes.
- Database tests use PostgreSQL 15.19 at `127.0.0.1:5432`.
- The run opens no socket to Atlassian.
- The suite covers every case listed in the automated-test table in `spec/plan.md`.

### T4.2 Boot the sample stack with no `.env`

**Depends on:** T4.1

**Acceptance criteria:**

- From a clean tree, `docker compose up` with no `.env` serves `http://127.0.0.1:5173` and the sample sprint from the backend.
- `docker compose down` stops the frontend, the backend, and PostgreSQL, and no other service from this Compose file remains.
- Sample mode does not call Jira.

### T4.3 Check logs and secrets

**Depends on:** T4.2

**Acceptance criteria:**

- A normal sample request log may include issue keys, `pageState`, and the word `sample`.
- That log does not include summaries, descriptions, account emails, tokens, or raw environment values.
- The API token and account email are absent from the page, the git tree, the application log, and `data/goal_status.json`.
- The Constitution Check in `spec/plan.md` still passes. Any new dependency is named in that file’s complexity tracking before it is kept.

### T4.4 Walk the page in a browser

**Depends on:** T4.2

Check current Chrome, Edge, or Firefox at about 1280 pixels wide. This is a manual check, not a browser-driver package.

**Acceptance criteria:**

- The sample sprint name, both dates, and the backend’s today are visible as text.
- The points label and the goal status are both text. Color is not the only signal.
- Blocked, Overdue, Unassigned, and Overloaded stay visible when a count is 0, with “Nothing needs attention.”
- Choosing a new goal status, refreshing, and restarting the backend keeps that selection.
- Sample keys are not links.
- For the default one-line goal, the summary is readable before the lists.
- **Milestone M4:** SC-001 through SC-010 hold. Sample mode needs no Jira site. Live mode runs only when `DATA_SOURCE=live`.
