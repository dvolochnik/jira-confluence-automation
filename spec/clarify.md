# Clarifications: Sprint Health Dashboard

Senior review of `spec/constitution.md` (version 1.1.0, ratified 2026-10-09) and `spec/specification.md` (Draft, 2026-10-09). `project_spec.md` is included where the specification says that file wins.

Severity: **High** blocks a single implementation. **Medium** will fork the UI, the mapper, or the tests. **Low** is real but local.

## Precedence

Three documents claim authority, and they do not agree:

- The constitution says it governs specifications, that principles I–V and the version pins are binding, and that a conflict is resolved by changing the spec. It records no exception for this feature. Governance also says the Sync Impact Report at the top of the constitution is removed before the file is committed. The report is still in the ratified text.
- `specification.md` says it adds no behavior, and that where it disagrees with `project_spec.md`, `project_spec.md` wins until that file is edited.
- `project_spec.md` says it is the contract for the page, and that it wins over a later comment.

An implementer cannot satisfy the constitution and the product contract at the same time. The constitution describes a Jira and Confluence job runner with PostgreSQL history. The product contract describes a read-only sprint page and one local file. Decide which document is amended before implementation starts. The items below assume the dashboard is the product to build, and they mark every place the constitution would still reject that build.

## Contradictions

### C-01. The constitution and the dashboard are different products

**Severity:** High

The constitution’s purpose is repeatable jobs against one Jira Cloud site and its Confluence space, with write-back when the operator starts a named action, and with every run stored in PostgreSQL. The user is a team lead who starts jobs and reviews outcomes.

The specification’s user is a manager of one team. The page reads one sprint and stores one local judgment. Confluence, Jira writes, job history, and a database are out of scope. Live mode is GET-only.

`project_spec.md` matches the specification on this scope. The constitution tells reviewers to fix the spec. The specification tells reviewers to obey `project_spec.md`.

**Decide:** Amend the constitution to this dashboard (drop Confluence, remote write-back, and PostgreSQL as the system of record), or amend the dashboard spec so it is a job runner. Do not leave both in force.
**Justification:**  constitution wins here



### C-02. PostgreSQL and a third Compose service, versus no database and two services

**Severity:** High

The constitution pins PostgreSQL 15.19 (`postgres:15.19`), the `pg` driver 8.23.1, versioned SQL migrations, and database tests against that server. Folder structure requires `backend/src/db/migrations/` and `backend/src/db/queries/`. Application state is job definitions, run history, and copied fields.

The specification says this version has no database, and that PostgreSQL and SQLite are outside the version. NFR-001 says `docker compose up` starts the React frontend and the Node.js backend, and that shutdown leaves no third service. `project_spec.md` says the same thing: one frontend service, one backend service, no database install.

A Compose file cannot both include `postgres:15.19` and leave no third service. A backend cannot both be the only process allowed to open PostgreSQL and have no database.

**Decide:** Remove the database from the constitution for this version, or remove the two-service rule from the product spec and specify the schema. Also decide what happens to the constitution’s `pg` pin if the file store stays.
**Justification:**  constitution wins here

### C-03. Run history, versus a snapshot that is thrown away

**Severity:** High

The constitution stores each run so the operator can see what was read, what was written, and what failed. Partial remote writes must be visible in logs and in stored job status.

The specification’s sprint model exists for one request and is dropped after the response. Restarting the backend drops memory. The only stored value is `data/goal_status.json`. There is no job-status entity, and a failed Jira call must leave that file unchanged.

**Decide:** Confirm that this version stores no run history. If that stands, the constitution’s audit requirement needs an explicit exception, including what a failed Jira call writes to the log.
**Justification:**  constitution wins here

### C-04. A Story, Bug, or Task with a parent is counted, or it is excluded

**Severity:** High

`project_spec.md` defines a subtask as type Sub-task or Subtask, or a parent field set on a type that is not Story, Bug, or Task. A Story, Bug, or Task with a parent still counts. That is the normal Jira shape for a story under an epic.

The specification’s edge cases exclude “Sub-task, Subtask, and any other type with a parent.” FR-036 excludes “any other type that has a parent” along with epics and custom types. Read one way, “other” means “other than Story, Bug, and Task.” Read the other way, every issue with a parent is dropped, including stories under epics, and the live page is empty on a team-managed board.

The specification says `project_spec.md` wins. Its own MUST still reads the other way.

**Decide:** Adopt the `project_spec.md` rule in FR-036 and in the edge cases: Story, Bug, and Task count even when `parent` is set. Exclude Sub-task, Subtask, and any non-counted type. State that an epic parent does not exclude a story.
**Justification:**  Adopt the `project_spec.md` rule in FR-036 and in the edge cases

### C-05. What the default sample sprint contains

**Severity:** High

`project_spec.md` says the sample sprint contains one subtask under a counted story, one not-done story with a null assignee, and one done story with a null assignee. Only the not-done story appears on Unassigned. Fixtures also include one overloaded person and one even-load case.

FR-045 says the default sample is one sprint with a non-empty goal, and that separate fixtures cover the other bands, the even load, an issue on two lists, a subtask, a done issue, an issue with no points, an issue with no due date, a null or whitespace goal, and the flag cases. “Separate” reads as “not the default file.” Those fixtures must not add extra bands to the default page.

The default page is what SC-001 and the manual browser check open. The two documents do not name the same rows for that page.

**Decide:** Write the default sprint as data: name, goal, start, end, issues, and the expected lists for a named `asOfDate`. Say which cases live only in test fixtures.
**Justification:**  keep FR-045


### C-06. Name every missing live variable, or only the first

**Severity:** Medium

The screen section says the missing-configuration state names each missing variable. `project_spec.md` says the page shows which variable name is missing. FR-042 says the page names that variable, singular. The API has one field, `error.missingVariable`, “the first missing live variable.”

Two unset variables cannot be both “each” and “the first” unless the message is allowed to name more variables than the one field holds.

**Decide:** Either return every missing name (change the API), or show only the first and change the screen sentence. Name the order the four variables are checked.
**Justification:** show only the first and change the screen sentence.

### C-07. Negative story points are shown as the original number, or as missing

**Severity:** Medium

`project_spec.md` treats negative points as missing, and missing points display as an em dash, while the sum adds zero. FR-038 treats null, missing, non-numeric, and negative as zero for the sum, and says the row MAY show the original number. The issue model says null means “no points” after the zero rule, which does not say whether a negative survives as a number.

A row can legally show `-3`, `0`, or an em dash, and still add zero.

**Decide:** Store null and show the em dash for negative and non-numeric points. Keep a stored zero as `0`.
**Justification:** keep FR-038


### C-08. An assignee with an account id and no display name

**Severity:** Medium

No assignee means null, missing, or an assignee with no account id and no display name. An account id with an empty display name is still assigned, so the issue stays off Unassigned. A deactivated account is still assigned.

The API `assignee` field is “display name, or null when unassigned.” FR-027 says the row shows the assignee or “Unassigned.” A null display name therefore renders as Unassigned on a row that is not on the Unassigned list. Person load’s `name` is the display name, so Overloaded has no label for that person either.

**Decide:** Define the row label when the account id is present and the display name is missing or blank. Use that same label on Overloaded. Do not use the word Unassigned for that row.
**Justification:** keep FR-027

### C-09. A blocked-by link with no key cannot be stored on the issue

**Severity:** Medium

FR-029 says a link with no key still makes the link signal true, and the row then says “Blocked by” with no key. A missing links field makes the signal false.

The issue model has `blockedByKeys` only. The note says the list may be empty while the signal is true. An empty list is also what “no links” would be. There is no boolean. The two states are the same value.

**Decide:** Add an explicit signal flag, or store a sentinel that is distinct from “no links.” Do not use an empty list for both.
**Justification:** keep FR-029


### C-10. “Today” is the container calendar, or the host machine calendar

**Severity:** High

The specification’s assumptions say today is the backend container’s local calendar. `project_spec.md` says locale for today is the machine default, and the specification says `project_spec.md` wins.

Compose does not set `TZ`. A container clock is often UTC. The host calendar is the machine default. Elapsed percent, the band, and Overdue all change if those dates differ. The specification also says the page must not apply a team timezone.

**Decide:** Define today as one clock. If it is the host calendar, the Compose file must set the container timezone from the host. If it is UTC, say UTC in both documents.
**Justification:** Define today as the host calendar


### C-11. “The goal is not set” is also what a failed load looks like

**Severity:** Medium

FR-017 says a missing or whitespace goal means the page says the goal is not set. On `no_active_sprint`, `multiple_active_sprints`, `missing_config`, and `source_error`, `sprint` may be null, so there is no goal text, while `goalStatus` is still returned and the control stays on screen.

Using the FR-017 sentence in those states tells the manager the sprint has no goal. The true state is that the goal text is unknown. The UI section describes “Goal text missing” only as its own ready-page case.

**Decide:** On those four error states, show the error and the goal-status control, and do not show the “goal is not set” sentence. Reserve that sentence for a loaded sprint whose goal is null or whitespace.
**Justification:** Use the FR-017

### C-12. The goal control is required on missing configuration, and the screen section never says so

**Severity:** Medium

The API includes `goalStatus` for `missing_config`. FR-008 says the control remains available on a live error. The screen paragraphs for “no active sprint,” “more than one active sprint,” and “source error” repeat that the control remains. The “missing live configuration” paragraph does not.

**Decide:** State that the control is visible for `missing_config`, with the last saved status, and that POST `/api/goal-status` still works in that state.
**Justification:** State that the control is visible for `missing_config`, with the last saved status, and that POST `/api/goal-status` still works in that state


### C-13. The goal is never truncated, and the summary fits a 1280px window

**Severity:** Medium

FR-016 says the goal is shown in full and is not truncated. NFR-006 says that on a 1280-pixel-wide window the summary is readable without scrolling through the lists. The goal is part of the summary. No maximum length is given. A long goal makes those two MUSTs impossible at the same time.

**Decide:** Keep the full text and drop the above-the-fold rule for long goals, or set a length at which the summary scrolls while the text remains complete. State whether newlines in the goal are preserved.
**Justification:** Keep the full text

### C-14. “This file adds no behavior” versus a normative HTTP contract

**Severity:** High

The specification’s introduction says it adds no behavior and that `project_spec.md` wins on disagreement. The API chapter then requires behavior `project_spec.md` never states: `GET /api/sprint-health` and `POST /api/goal-status`, HTTP 200 for expected Jira failures, the `pageState` enum, `gapDisplay`, and the 400 and 500 bodies.

If the introduction is applied strictly, that chapter is not a requirement. If the chapter is applied strictly, the introduction is false.

**Decide:** Say that the API chapter is binding elaboration, and list any API rule that is intentionally stricter than `project_spec.md`. C-06 is one of those rules.
**Justification:**  Say that the API chapter is binding elaboration, and list any API rule that is intentionally stricter than `project_spec.md'

### C-15. Saving the current goal status again, from a control that cannot reselect it

**Severity:** Low

User story 2 scenario 4 and FR-022 say that choosing the value already saved rewrites the file and succeeds. FR-018 requires a fieldset of three choices with exactly one selected. A radio fieldset does not fire a change when the selected choice is activated again, so the manager cannot perform that scenario from the specified control.

**Decide:** Say that scenario 4 is an API rule for a second POST of the same token, and that the page does not have to offer a way to click the already selected choice. Or require a control that can submit the current value again.
**Justification:** scenario 4 is an API rule for a second POST of the same token,

## Gaps

### G-01. The feature spec never adopts the constitution’s pins or records an exception

**Severity:** High

The constitution pins JavaScript, React 18.3.1, React DOM 18.3.1, Vite 8.3.4, Node.js 24.21.0, Express 5.2.1, `pg` 8.23.1, PostgreSQL 15.19, and Compose. New code must land in the constitution’s tree: `frontend/src/pages|components|api|styles`, `backend/src/routes|services|clients|db`, `backend/sample/`, and matching `test/` trees. A deviation must be justified or acceptance is blocked.

The feature spec names React, Node.js, and Compose, and it does not name Vite, Express, Node 24.21.0, or image tags. It requires `data/goal_status.json`, which is not in the constitution tree, and it forbids the database tree the constitution requires. It does not say whether the frontend is a Vite dev server or a built app served by Vite. It does not require a lockfile, so transitive versions can move while the constitution says versions are pinned.

**Decide:** Put the pins that still apply into the feature spec. Record a constitution exception for “no PostgreSQL, no Confluence client, goal status in `data/`.” Name the frontend image command (`vite` dev, `vite preview`, or something else) and require a lockfile.

**Justification:** Yes

### G-02. Compose has no ports, no API origin, and no volume path

**Severity:** High

SC-001 says the sample sprint is served on the localhost URL stated in the README. The spec never sets that URL, the frontend port, or the backend port. Both services bind to localhost. The browser calls `/api`. Nothing says whether that is same-origin through a Vite proxy or a second origin that needs CORS.

The goal file is “on the host at `data/goal_status.json`, mounted into the backend.” The container path and the volume entry are not specified. NFR-001 says sample mode needs no `.env`. It does not say what the page shows if the browser’s first request arrives before the backend is listening.

**Decide:** Fix the URL, both host ports, how `/api` is reached, the host path and the container path of the goal file, and the startup behavior when the backend is not up yet.
**Justification:** Yes

### G-03. There is no way to keep a band fixture stable

**Severity:** High

Today is the process calendar date. Sample dates are ISO dates in a file. Elapsed percent, the band, and Overdue are functions of today. FR-045 and SC-002 require fixtures for On track, for a gap of 15 (At risk), and for a gap greater than 15 (Off track). A static file hits those gaps on one calendar day.

`asOfDate` is an output of `GET /api/sprint-health`. No input, environment variable, or test seam sets the clock. Query parameters must not select a sprint; the spec does not say whether a date parameter is forbidden too. NFR-009 requires automated band tests with no network.

The same hole makes the default page’s band change from day to day. SC-001 does not promise a particular band. SC-002 does.

**Decide:** Allow tests to pass a fixed today into the snapshot function, and define the default sample’s dates relative to that rule. State that the running app’s today is still the process calendar date. Give one worked example for the default sprint, including the `asOfDate` used to check it.
**Justification:** Yes

### G-04. End date before start date, and sprint dates that are not dates

**Severity:** Medium

Due dates have a rule: missing, empty, or unparseable stays off Overdue. Sprint start and end do not. The elapsed formula divides by end minus start. A same-day sprint is specified as a special case (0 before that day, 100 on or after it), which avoids a zero divisor only if that case is applied instead of the division. An end date before the start date is not mentioned. Unparseable sprint dates are not mentioned. One null date is covered by user story 1 scenario 6 (“start or end”); the API sentence “null dates” can be read as both.

The repository’s elapsed-percent calculator rejects an end date before the start date. The specification does not say what the page does.

**Decide:** If either sprint date is null, empty, or unparseable, use `dates_unavailable`. If the end date is before the start date, use `dates_unavailable` rather than a negative day count. State that the same-day rule replaces the division.
**Justification:** Yes

### G-05. Jira datetimes are not calendar dates

**Severity:** High

Sprint start and end on Jira Cloud are datetimes. Due dates may be datetimes. The page compares calendar dates and ignores time of day. The spec does not say which timezone supplies the calendar date. `2026-10-09T00:00:00.000Z` is 9 October in UTC and 8 October in a negative offset. That shift changes elapsed percent and Overdue. C-10 chooses the clock; this item is the conversion rule.

**Decide:** Define the conversion. For example, a date-only string is that date, and a datetime is the calendar date in the clock chosen in C-10. Apply the same rule to sprint dates and due dates.
**Justification:** Yes

### G-06. The live Jira calls are not specified as requests

**Severity:** High

Live mode reads the active sprint from “the Jira Agile API,” then issues from “the issue search API,” and every live call is GET. The paths, query parameters, API version, and auth header format are not named. On current Jira Cloud, platform issue search is a POST. GET `/rest/agile/1.0/sprint/{sprintId}/issue` is a GET that can load a sprint. The spec does not say whether that Agile resource is the “issue search API.”

Also unspecified:

- How an active sprint is filtered (`state=active` or a client-side filter).
- The exclusive field list. The spec says the call includes the fields the rules need and does not request comments or attachments. It does not forbid description or other fields.
- Page size, and what happens when a later page fails after an earlier page succeeded. “No fabricated rows” suggests the whole snapshot fails. The spec never says to discard issues already read.
- Timeout, DNS failure, TLS failure, and connection reset. FR-043 covers an HTTP error and a JSON shape the mapper cannot read. Those network failures are neither.
- What “the mapper cannot read” means when one issue is bad and the rest are valid (see G-07).

**Decide:** Name the two GET paths and the query parameters. State that a failed page, a timeout, a DNS error, or a TLS error is `source_error` with no rows. State that `httpStatus` is null when there is no HTTP response.
**Justification:** yes

### G-07. One unreadable issue, and the shapes the mapper must accept

**Severity:** High

FR-043 fails the snapshot when the mapper cannot read the JSON shape. It does not say whether one issue with a missing key, an unknown status category, or an unexpected flag shape fails the whole board.

These payloads are required and not shaped:

- Story points: “the Jira story point field.” A differently named numeric field is not mapped. Out of scope includes “a non-standard story-point custom field.” The field name and id are not given. Classic “Story Points” and team-managed “Story point estimate” are different names and different ids, and the id is site-specific. No discovery rule is given (field-name lookup versus a fixed id).
- The impediment flag’s JSON (boolean versus `{ "value": "Impediment" }` versus an array).
- Issue link JSON: which object is “an inward link whose description is ‘is blocked by’.”
- Status category: the model stores `Done`, `In Progress`, or `To Do`. Jira also sends a key such as `done`. The spec does not say whether the mapper reads `name` or `key`, or whether `done` is unreadable.
- `parentSet`: the parent field, the classic epic link, or both. FR-036 uses this flag. Mapping epic link into it would interact with C-04.

**Decide:** Fail the snapshot only when the sprint list or the issue array cannot be read. Skip or default a single bad field (points as zero, flag false, links absent) and define those defaults. Name the story-point field policy, including team-managed “Story point estimate.” Name the Jira properties copied into `flagged`, `blockedByKeys`, `statusCategory`, and `parentSet`.
**Justification:** Yes


### G-08. Invalid live configuration has no page state

**Severity:** Medium

NFR-010 says `JIRA_SITE_URL` is an HTTPS origin and certificate checks stay on. `project_spec.md` also says the URL has no trailing path beyond the host, and that the board id is numeric. The specification does not say what happens when the URL is `http`, has a path, has a trailing slash, or is an empty string, or when the board id is blank or not numeric. It does not say whether that check is startup or the first request, or which `pageState` it uses. Empty string is not the same as unset, and “missing” is the only word FR-042 uses.

`DATA_SOURCE` other than `sample` or `live` is an error on startup. The process exit code, the message, and whether Compose should show that message are not specified. A missing sample file “fails at startup with a clear file error.” The channel (container log versus an HTTP body) is not specified. Invalid sample JSON is not classified at all. Sample mode has no stated `source_error`.

**Decide:** Treat empty live variables as missing. Validate URL and board id before any Jira call and return `missing_config` or a named sibling state, with the variable name and no secret. Exit non-zero on a bad `DATA_SOURCE` or a missing sample file, with the path in the process log. Define invalid sample JSON as a startup failure too.
**Justification:** Yes


### G-09. Sample file path and schema

**Severity:** Medium

Sample mode reads “the built-in JSON.” Constitution fixtures live in `backend/sample/`. Neither the specification nor `project_spec.md` names the file. FR-045’s extra fixtures have no paths. The sample object is described in prose (name, goal, start, end, issues, ISO dates, nulls) and not as a schema. Tokens, emails, and internal URLs are forbidden; “internal URLs” is not defined.

**Decide:** Give paths for the default file and the fixtures. Define the sample JSON schema so it maps through the same model as live data. Define “internal URLs” as any URL, or as non-public hosts only.
**Justification:** Yes

### G-10. Screen composition for each `pageState`, including failures that are not a `pageState`

**Severity:** High

The API lists six page states. The screen section narrates them and does not assign regions 1–7. `sprint` “may” be null on errors, so a sprint name on an error page is neither required nor forbidden. `dates_unavailable` “omits” percents and does not say whether `completedPercent`, `elapsedPercent`, `gap`, and `gapDisplay` are null or absent. `committedPoints` and `donePoints` are “present so tests can check the sums” and are not tied to a page state.

`GET` 500 means the screen has no snapshot. The specification does not say what the manager sees. A connection error before any status code is not a page state. There is no spinner requirement for sample mode. Live mode “waits on Jira” and then shows a result or an error. The waiting screen is unspecified.

**Decide:** Publish one matrix: for each `pageState`, which regions render, which JSON fields are null, and the exact error sentence. Specify the waiting text for live mode and the text for a `GET` that does not return JSON.
**Justification:** Yes

### G-11. User-facing sentences that the tests cannot lock

**Severity:** Medium

These strings are fixed: “Nothing needs attention.”, “Flagged”, “Status: Blocked”, “Blocked by”, “Unassigned”, the three status words, the three tokens, the four headings, and `YYYY-MM-DD`.

These are only described: the goal-is-not-set sentence, the dates-unavailable sentence, no-active-sprint, more-than-one-sprint, missing-variable, source error, save error, invalid status, and the startup file error. Heading count format (`Blocked (3)` versus `Blocked 3`) is not specified. Column headers are required only for Assignee on Unassigned. The em dash character is not named (U+2014 versus a hyphen). `gapDisplay` says plus when behind, minus when ahead, and `0.0` when zero, and it does not give the full string (`+15.0`, `+15.0 percentage points`, or `behind by 15.0`).

FR-005 requires one decimal place. User story 1 scenario 5 says completed percent “is 100” when commitment is zero, which can be read as `100` rather than `100.0`.

**Decide:** Write the exact strings, including the heading pattern, the em dash, and `+15.0` / `-15.0` / `0.0`. Use one decimal place for every displayed percent, including `100.0` and `0.0`.
**Justification:** Yes

### G-12. Live issue links have no URL recipe

**Severity:** Medium

In live mode each issue key links to that issue on the configured site and opens in a new tab. Sample keys stay plain text. The URL recipe is not given. A trailing slash on the site origin (G-08) changes string concatenation. `rel` for `target="_blank"` is not mentioned. The sprint name link is optional; the issue link is not.

**Decide:** Define the issue URL as the HTTPS origin plus `/browse/` plus the issue key, opened in a new tab with `rel="noopener noreferrer"`. Keep the sprint-name link optional.
**Justification:** Yes

### G-13. Atomic goal-file replace is not a complete procedure

**Severity:** Medium

The write goes to a temporary file, then replaces the target, then returns. A crash must not leave a partial JSON file that the next load treats as valid. Two browsers on one machine are allowed to race, and the last successful replace wins. The parent `data/` directory is created if it is missing.

The spec does not require a unique temporary name. Two writers that share one temporary path can leave a torn file, which breaks the crash rule while honoring the race rule. `project_spec.md` allows Windows. Replacing an existing file atomically is not the same call on Windows as on Linux. The spec does not mention that.

The 500 body includes the previous token. When the file was missing and the first save fails, there is no previous token. The control’s display default is On track.

**Decide:** Require a unique temporary file in the same directory, then an atomic replace that works on Windows and Linux. On a failed first save, return `on_track` as the previous status and do not create the target file.
**Justification:** Yes

### G-14. The saved judgment is not tied to a sprint, and the page does not say so

**Severity:** Medium

The file is not keyed by sprint id, board, or data source. A status saved for one sprint is shown for the next sprint until the manager chooses again. `project_spec.md` says the manager can set the status again when the underlying sprint changes. The page has no rule for a stale-status marker, and the file stores no sprint name to compare.

This is specified persistence. It is unspecified UI. The control looks equally authoritative after the board rolls to a new sprint.

**Decide:** Confirm that the stored status is shown with no staleness warning when the sprint name changes. If a warning is required, the file has to remember which sprint it was saved for, which the current model forbids.
**Justification:** Yes

### G-15. Constitution test bar versus the feature’s test list

**Severity:** Medium

The constitution says every behavior that decides what to read, write, or skip has an automated test, against fixtures, with no socket to Atlassian. Database tests target PostgreSQL 15.19 (C-02).

NFR-009 and SC-009 require Node.js test-runner tests, with no browser and no network, for the bands, the four lists, subtask exclusion, and the goal-status round trip. A manual browser check confirms the summary and four headings.

Not required by the feature spec, and still “what to read or skip,” if those rules stay: missing configuration does not call Jira, zero versus many active sprints, `dates_unavailable`, zero commitment, negative points, a story with a parent, GET-only, token and email absent from logs and from the goal file, and a failed replace leaving the previous file.

The constitution’s `frontend/test/` tree is not mentioned. NFR-009 forbids a browser and names the Node.js test runner, which does not by itself render React.

**Decide:** List the automated cases above. Say whether `frontend/test/` is required in this version. Keep the manual browser check as a delivery step, not as a substitute for the rule tests.
**Justification:** Yes

## Unclear requirements

### U-01. Elapsed-day formula, display rounding, and a gap that prints as 15.0

**Severity:** High

The formula is end minus start, then today minus start, divided by that day count, times 100. Clamps: 0 before the start date, 100 on or after the end date. On the start date itself the formula yields 0. The prose in `project_spec.md` also says “the percent of sprint days that have passed,” which is often implemented as an inclusive day count (end minus start plus 1). No worked example is in the specification.

Worked check of the written formula: start `2026-10-01`, end `2026-10-11`, today `2026-10-06` → day count 10, portion 5, elapsed 50. Start `2026-10-01`, end `2026-10-04`, today `2026-10-02`, completed 18.3 → elapsed `100/3` (33.333…), exact gap about 15.033, which is Off track. Rounded to one decimal, that gap prints as 15.0 if half-up rounding is used. The edge-case text says display rounding must not move an exact 15 into Off track. It does not say a printed 15.0 may still be Off track. The screen is forbidden to compute the band itself, so it must show `pointsVersusTime.label` and must not derive the band from `gapDisplay`.

Rounding mode is not named. `completedPercent` and `elapsedPercent` are described as already rounded for display. `median` and `threshold` are exact in JSON and rounded by the screen. `gap` is exact and `gapDisplay` is rounded. JSON numbers do not preserve the decimal exactness the band rule depends on.

**Decide:** Put a worked example in the spec, including the start-date case (0) and this 15.0-display / Off-track case. Require half-up to one decimal place, or name another mode. State that `label` is authoritative and that `gap`, `median`, and `threshold` are either decimal strings or values the client must not re-band. Round median and threshold in one layer only.
**Justification:** Yes

### U-02. Zero committed points when the dates are missing

**Severity:** Medium

When committed points are zero, completed percent is 100 and the points label is On track (user story 1 scenario 5, FR-010). When the start or end date is missing, the points signal says the dates are unavailable, shows no percent, and does not treat the gap as zero (FR-014). Both can be true on one sprint. FR-012’s band rules do not say “only when both dates exist.”

**Decide:** Missing dates win. `pageState` is `dates_unavailable`, `label` is null, and the zero-commitment rule does not force On track. Still return `committedPoints` and `donePoints` so the zero sum can be tested.
**Justification:** Yes

### U-03. Status category, type names, and the blocked-by description

**Severity:** High

Status name `Blocked` is case-insensitive. Status category is given as the exact words Done, In Progress, and To Do. Case, surrounding whitespace, and name-versus-key are not specified. A mapper that requires the name `Done` will treat the key `done` as not done, or as an unreadable payload (G-07).

Story, Bug, and Task are case-insensitive exact names. “User Story” is excluded. Trimming is not mentioned, so `"Story "` can be excluded as a custom type. Sub-task and Subtask are both excluded by name.

The link signal matches the inward description “is blocked by.” Case and extra whitespace are not specified, unlike the Blocked status name. When several keys are present, their order in the “Blocked by …” text is not specified. A mix of keyed and keyless links is not specified beyond C-09.

**Decide:** Compare the status-category name, case-sensitive, after trim, and accept the Jira key `done` / `indeterminate` / `new` as those three names. Trim issue type names before the case-insensitive match. Match the link description case-insensitively after trim. Sort linked keys ascending and append them after “Blocked by”.
**Justification:** Yes


### U-04. Sort order

**Severity:** Medium

Issue lists sort by key, ascending. Lexicographic order puts `TEAM-10` before `TEAM-9`. Numeric order does the opposite. Overloaded sorts by open points descending, then display name. Case, locale, and a tie on both fields are not specified. The API says rows arrive sorted. The screen is not forbidden to sort again.

**Decide:** Sort issue keys lexicographically on the Unicode code unit, ascending. Sort overloaded by exact open points descending, then display name with a fixed locale (for example `en`, base sensitivity). The screen renders the API order.
**Justification:** Yes

### U-05. Who a “person” is on Overloaded

**Severity:** Medium

Person load is one number per assignee with open points greater than zero. The row name is the display name. Two account ids can share a display name. The spec says two assignees stay two people when their points match, and the sort then uses display name. It never says the aggregation key is the account id.

Unassigned work does not create a person. Empty-string account id and empty-string display name are not defined (C-08 covers a present id with a blank name). If every counted issue has zero open points, the median set is empty. Nobody can reach 5 points in that case, so the list is empty, but the median formula does not say “do not evaluate an empty set.”

**Decide:** Aggregate by account id. If the display name is missing, use the label from C-08. If no person has open points greater than zero, the Overloaded list is empty and the median is not computed.
**Justification:** Yes

### U-06. Numbers on the wire and on the row

**Severity:** Medium

Fractional points are summed as numbers and are not rounded to a whole point first. The numeric type (IEEE float versus decimal) is not specified, and `0.1 + 0.2` can move a gap across 15. Display of a row “MAY” show the original number. Open points are “the summed number” with no decimal rule, while median and threshold use one decimal. A displayed threshold can look equal to displayed open points when the exact comparison included the person.

Zero is a real estimate and is not an em dash. That part is clear.

**Decide:** Use decimal arithmetic for sums, percents, the median, and the threshold. Show issue points and open points with trailing zeros stripped (`0.5`, `5`, `0`), and show the em dash only for null points.
**Justification:** Yes

### U-07. Goal file contents that are almost valid

**Severity:** Low

A missing, empty, or illegal file displays On track and is not rewritten until a successful save. The object has one field, `status`. The spec does not say whether extra keys, with a legal `status`, make the file illegal. Whitespace around the token is not mentioned. Pretty-printed JSON with the one field is not distinguished from the compact example.

**Decide:** Accept any JSON object whose `status` is exactly one of the three tokens, ignore extra keys, and do not treat surrounding whitespace inside the token as valid. Rewrite the file as the one-key object only when the manager saves.
**Justification:** Yes

### U-08. `pageState` boundaries and the goal-file sentence

**Severity:** Medium

`dates_unavailable` is “a ready snapshot whose points percents are omitted.” It is also its own `pageState`, not `ready`. A sprint with both dates and a whitespace goal is `ready` or `dates_unavailable` with `goalText` null, not a seventh state. That part can be inferred. It is easy to add a `goal_missing` state the API does not have.

“The backend MUST NOT read or write the goal-status file while handling a source failure beyond loading the current status.” The permission is “load.” The prohibition is “write.” “Source failure” might or might not include `missing_config` (no Jira call) and `multiple_active_sprints` (Jira did respond).

`sprint` “may” be null on the four error states. “May” allows a partial sprint object. FR-007 says the page must not pick a sprint when several are active, which a populated `sprint.name` would start to do.

**Decide:** Use `ready` when both dates exist, even if the goal text is null. Use `dates_unavailable` only for a loaded sprint with a bad date. On the four error states, `sprint`, `pointsVersusTime`, and `attention` are null, not optional. On all four, load the goal file and do not write it.
**Justification:** Yes

### U-09. Environment values and the page URL

**Severity:** Medium

Unset `DATA_SOURCE` means sample. `sample` and `live` are the only legal values, which implies case-sensitive match, but that is not stated. `Live` and `SAMPLE` are unspecified. The backend reads the environment “again” when data source changes: either at process start, or on every request. Both readings fit the sentence.

“The page URL MUST NOT accept a sprint id.” That can mean ignore the parameter, or reject the request. `project_spec.md` says a sprint id parameter is extra and not required, which sounds like ignore. FR-044’s “MUST NOT accept” sounds like reject.

**Decide:** Compare `DATA_SOURCE` case-sensitively. Read environment variables on each request, or only at startup, and say which. Ignore unknown query parameters, including a sprint id, and still return the configured sprint.
**Justification:** Yes

### U-10. Logs

**Severity:** Low

NFR-007 says a normal sample request must not include issue descriptions beyond the key, and must not include environment values. That can mean “keys are allowed, description bodies are not,” or “log nothing about an issue except its key” (no summary, no points). The API table says tests and logs can show the source. `DATA_SOURCE` is an environment value. Logging `source=sample` can be read as logging an environment value.

**Decide:** Logs may include issue keys, the page state, and the source word `sample` or `live`. They must not include summaries, descriptions, account emails, tokens, or raw environment values.
**Justification:** Yes

### U-11. The goal control widget, waiting, and startup errors

**Severity:** Low

The control is a fieldset of three visible choices, one selected, not a free-text box. It does not say radio inputs versus buttons. Keyboard behavior is the browser default, which fits radios.

Live mode has no specified waiting copy (G-10). A missing frontend entry or sample file fails before the screen is served, “with a clear file error rather than a blank page.” If the process never listens, the browser has nothing to show except its own connection error. The “clear file error” then has to be the container log.

**Decide:** Use a radio group inside a fieldset, one radio per token, legend visible. While a live request is in flight, show a single plain sentence and no issue rows. Write startup file errors to the process log and exit non-zero.
**Justification:** Yes

## Suggested order to close

1. C-01, C-02, and C-03, so the constitution and the dashboard describe one system.
2. C-04, C-05, G-03, and G-07, so eligibility, the sample page, and live points can be implemented once.
3. C-10, G-05, G-06, and U-01, so the band does not depend on the calendar or the JSON parser.
4. C-06, C-11, C-12, and G-10, so each `pageState` has one screen.
5. G-02, G-08, G-12, and G-13, so Compose, secrets, links, and the goal file have a single recipe.
