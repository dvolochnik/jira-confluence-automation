# Module 17 Completion Report

## Specification Contents
# Feature Specification: Sprint Health Dashboard

**Feature Branch**: `001-sprint-health-dashboard`

**Created**: 2026-10-09

**Status**: Draft

**Input**: User description: "A local dashboard for one team’s active sprint. A manager sees whether the sprint is on track, then the blocked, overdue, unassigned, and overloaded work that needs a decision. Sample mode runs with no Jira token. Live mode reads one Jira Cloud board. The only value the manager writes is the sprint-goal status, stored in a local file."

This file expands `project_spec.md` into SpecKit form: user stories, the screen, the API, and the data model. It adds no behavior. Where this file and `project_spec.md` disagree, `project_spec.md` wins until that file is edited.

The page is a snapshot. It is one sprint, two independent health signals, and four short lists. It is a read of the sprint plus one local judgment.

## User Scenarios & Testing *(mandatory)*

The only actor is the manager of one team. The manager reads the snapshot and sets the sprint-goal status. There is no second role, no shared session, and no account.

| Use case | Actor | Action | Outcome |
| --- | --- | --- | --- |
| UC-1 Read health | Manager | Opens the page in sample mode | Sees sprint name and dates, the points-versus-time band, the goal text, and the four attention lists |
| UC-2 Judge the goal | Manager | Chooses On track, At risk, or Off track | That choice is stored on the host and is still selected after refresh and after a backend restart |
| UC-3 Read a live board | Manager | Starts the app with live configuration | Sees the same page for that board’s single active sprint |
| UC-4 Handle a live miss | Manager | Opens the page when Jira cannot supply one active sprint | Sees a clear error, no invented rows, and the last saved goal status unchanged |

### User Story 1 - Read the sprint snapshot (Priority: P1)

A manager opens one page and, in a short look, learns whether completed story points are keeping up with the calendar, and which blocked, overdue, unassigned, or overloaded work needs a decision. Sample mode is the default, so this reading works with no Jira account and no token.

The page always stacks the same regions: sprint name and dates (with today’s date), the points-versus-time signal, the sprint goal and its status, then Blocked, Overdue, Unassigned, and Overloaded. A healthy sprint still shows both signals. An empty list still shows its heading and the sentence “Nothing needs attention.”

**Why this priority**: This is the whole visit. A page that shows only a summary, or that needs a token before it can be demonstrated, does not meet the version.

**Independent Test**: With `DATA_SOURCE` unset, start the stack and open the localhost page. The sample sprint renders one band, the goal text, and four list headings. Rule tests for the bands, the four lists, and subtask exclusion pass with no network access.

**Acceptance Scenarios**:

1. **Given** no Jira credentials and sample mode, **When** the manager opens the page, **Then** the page shows the sample sprint’s name and dates, a points-versus-time label, both percents when dates exist, the goal text, a goal-status control, and the four lists in order.
2. **Given** completed percent equals elapsed percent, **When** the snapshot is computed, **Then** the points label is On track.
3. **Given** completed percent is behind elapsed percent by 15 percentage points or less, and the gap is greater than 0, **When** the snapshot is computed, **Then** the points label is At risk.
4. **Given** completed percent is behind elapsed percent by more than 15 percentage points, **When** the snapshot is computed, **Then** the points label is Off track.
5. **Given** committed points are zero, **When** the snapshot is computed, **Then** completed percent is 100 and the points label is On track.
6. **Given** the sprint start or end date is missing, **When** the manager opens the page, **Then** the points signal says the dates are unavailable and shows no invented percent, and the goal signal still renders.
7. **Given** a subtask under a counted story, **When** the snapshot is computed, **Then** the subtask key is absent from every list and from point totals, and the parent’s points are counted once.
8. **Given** an issue matches two list rules, **When** the snapshot is computed, **Then** that issue appears once on each matching list.
9. **Given** a list has no matching rows, **When** the manager opens the page, **Then** the heading remains, the count is 0, and the list says “Nothing needs attention.”
10. **Given** the same sample data and the same calendar date, **When** the manager reloads, **Then** the labels, list membership, and row order stay the same.

---

### User Story 2 - Set the sprint-goal status (Priority: P2)

The manager judges the sprint goal separately from the points math. Jira does not store that judgment. The manager picks one of On track, At risk, or Off track. The page saves it immediately to a host file and shows the saved value. The points label does not change the goal status, and the goal status does not change the points label.

**Why this priority**: The points signal is calculated. The goal signal is the only judgment the manager can record, and it has to survive a refresh and a restart.

**Independent Test**: Set each allowed status, refresh the browser, and restart the backend. The same status is selected. An invalid value leaves the file unchanged. A missing file leaves the control at On track until the manager chooses.

**Acceptance Scenarios**:

1. **Given** the goal text is missing or only whitespace, **When** the manager opens the page, **Then** the page says the goal is not set and the status control is still usable.
2. **Given** no status has been saved, or the file is missing, empty, or holds another value, **When** the manager opens the page, **Then** the control shows On track and the file is left unchanged until the manager chooses a status.
3. **Given** the manager selects At risk, **When** the save succeeds, **Then** the host file stores `at_risk`, the control shows At risk, and a browser refresh and a backend restart both show At risk.
4. **Given** the manager selects the value that is already saved, **When** the save runs, **Then** the file is rewritten and the page still shows that value.
5. **Given** the client submits a value other than `on_track`, `at_risk`, or `off_track`, **When** the backend receives it, **Then** the file is unchanged and the page shows an error.
6. **Given** the write fails, **When** the manager has just chosen a new status, **Then** the page keeps the previous status and shows a save error.
7. **Given** a status was saved in sample mode, **When** the manager later runs live mode, **Then** the same file still supplies that status.

---

### User Story 3 - Read one live Jira board (Priority: P3)

The same page can read the active sprint of one Jira Cloud board. Only the source of the numbers changes. The health rules, labels, and lists stay the same. Live mode is read-only. A failure shows an error and does not replace the sprint with sample data.

**Why this priority**: Sample mode demonstrates the version. Live mode is the path that makes the same page true for the team’s board, and it is required in the build even when a demo uses sample data.

**Independent Test**: Configure `DATA_SOURCE=live` and the four Jira variables, then open the page. The active sprint is shown under the same rules. Remove one variable, or point at a board with no active sprint, and the page shows an error with no sample rows and no change to the goal-status file.

**Acceptance Scenarios**:

1. **Given** live mode and a board with one active sprint, **When** the manager opens the page, **Then** the snapshot uses that sprint and the same band and list rules as sample mode.
2. **Given** live mode and a required variable missing, **When** the manager opens the page, **Then** the page names that variable, Jira is not called, and the message contains no token value.
3. **Given** the board has no active sprint, **When** the manager opens the page, **Then** the page says so, shows no issue lists, and does not substitute sample data or the last closed sprint.
4. **Given** the board reports more than one active sprint, **When** the manager opens the page, **Then** the page shows an error and does not choose a sprint.
5. **Given** Jira returns an HTTP error or a payload the mapper cannot read, **When** the manager opens the page, **Then** the summary region shows an error, no fabricated issue rows appear, and the saved goal status is unchanged.
6. **Given** live mode, **When** an issue row is shown, **Then** its key links to that issue on the configured site and the link opens in a new tab. Sample mode leaves keys as plain text.
7. **Given** any live request, **When** the backend calls Jira, **Then** it uses GET only.

---

### Edge Cases

- A gap of exactly 15 is At risk. A gap greater than 15 is Off track. The band uses the exact gap. Rounding a displayed percent to one decimal place cannot move a 15.0 case into Off track.
- Elapsed percent is 0 before the start date and 100 on or after the end date. When the start and end dates are the same day, elapsed percent is 100 on or after that day and 0 before it.
- “Today” is the backend process’s current calendar date. A due date of today is not overdue. A due date of yesterday is overdue. Time of day on a date-time is ignored.
- A missing, empty, or unparseable due date stays off Overdue. The sprint end date is not copied onto that issue.
- A done issue stays in committed points and done points. It stays off Blocked, Overdue, and Unassigned. Its points are not open.
- Status category Done is the only done test. A status named Done whose category is not Done stays not done. An empty resolution does not change the category.
- Stories, bugs, and tasks are the counted types, matched on the type name, case-insensitive, and only for the exact names Story, Bug, and Task. “User Story” is excluded. Sub-task, Subtask, and any other type with a parent are excluded. Epics and other custom types are excluded. Exclusion runs before point sums and before list rules.
- An issue with null, missing, non-numeric, or negative story points adds zero. Zero is a real estimate. Fractional points such as 0.5 are summed as numbers. The issue still appears on a list when a list rule matches. Missing points display as an em dash.
- Blocked matches a flag (row text “Flagged”), a status name Blocked ignoring case (row text “Status: Blocked”), or an “is blocked by” link (row text “Blocked by” plus any linked keys that are present). One issue is one row. Signals are listed in the order flag, status, then link. An outward “blocks” link by itself does not match. A missing flag field or a missing links field makes that signal false. A blocker outside the sprint still counts and is not imported as its own row.
- No assignee means null, missing, or an assignee with no account id and no display name. A display name of “Unassigned” on a real account is still an assignee. A deactivated account is still assigned.
- Overloaded requires both open points strictly greater than 1.5 times the median and at least 5 open points. Equality on the median test is omitted. A person with fewer than 5 open points is omitted. One person with open work produces an empty Overloaded list, because the median is that person’s total. Unassigned open issues do not create a person on this list. People with zero open points are left out of the median.
- The goal-status file is single-user. If two browsers on the same machine save at once, the last successful write wins.
- Query parameters do not select another sprint. The page has no board switcher and no data-source toggle. Changing `DATA_SOURCE` takes effect when the backend reads the environment again.
- A missing sample file or a missing frontend entry fails at startup with a clear file error.

## Requirements *(mandatory)*

### Functional Requirements

**Snapshot**

- **FR-001**: The system MUST show one page for one team’s active sprint, with regions in this order: sprint name and dates, points-versus-time status, sprint goal and goal-status control, Blocked, Overdue, Unassigned, Overloaded.
- **FR-002**: The system MUST show the points signal and the goal signal together. Each uses the words On track, At risk, and Off track. The two fields stay independent, and the page MUST NOT combine them into one score.
- **FR-003**: The system MUST compute health rules on the backend from one sprint model. Sample JSON and live Jira responses are mapped into that model before any rule runs. The page MUST NOT branch the rules on the data source and MUST NOT compute the bands in the browser.
- **FR-004**: The system MUST recompute the snapshot from the current source on each page load. It MUST NOT keep a stale in-memory sprint across loads.
- **FR-005**: The system MUST print the backend’s current calendar date next to the sprint dates. Dates shown on the page MUST use `YYYY-MM-DD`. Percents and the gap shown on the page MUST use one decimal place.
- **FR-006**: The system MUST show sprint name, start date, and end date in the summary. In sample mode the sprint name is plain text. In live mode the sprint name MAY link to that sprint in Jira. That link is optional.
- **FR-007**: When the board has no active sprint, the system MUST say so and MUST NOT render issue lists or a previous sprint. When more than one active sprint is reported, the system MUST show an error and MUST NOT pick one.
- **FR-008**: An error state MUST replace issue rows. It MUST NOT mix sample issues into a failed live load. The goal-status control MUST remain available on a live error.

**Points versus time**

- **FR-009**: Committed points MUST be the sum of story points on counted issues. Done points MUST be the committed points whose status category is Done. An issue with no usable story points adds zero. Subtasks and other excluded types are omitted before the sum.
- **FR-010**: Completed percent MUST be done points divided by committed points, times 100. When committed points are zero, completed percent MUST be 100.
- **FR-011**: Elapsed percent MUST use calendar days from sprint start to sprint end. Day count is the end date minus the start date. The portion passed is today minus the start date, divided by that day count, times 100. Elapsed percent MUST be 0 before the start date and 100 on or after the end date. A same-day sprint MUST be 100 on or after that day and 0 before it. The system MUST NOT apply a team timezone or a working-day calendar.
- **FR-012**: Gap MUST be elapsed percent minus completed percent. The label MUST be On track when the gap is 0 or negative, At risk when the gap is greater than 0 and at most 15, and Off track when the gap is greater than 15. The band MUST use the exact gap, before display rounding.
- **FR-013**: The points row MUST show the text label, completed percent, elapsed percent, and the gap in percentage points with a sign so a gap ahead of the calendar and a gap behind it are distinct. The points signal MUST NOT be editable.
- **FR-014**: When sprint dates are missing, the points signal MUST say the dates are unavailable and MUST skip the percent. Missing dates MUST NOT be treated as zero elapsed. The goal signal MUST still render.
- **FR-015**: Issues added or removed from the sprint MUST change the commitment on the next load. This version MUST NOT freeze an original commitment.

**Sprint goal**

- **FR-016**: The system MUST show the sprint goal text in full as plain text. It MUST NOT truncate the sentence and MUST NOT render the goal as HTML.
- **FR-017**: When the goal text is missing or only whitespace, the page MUST say the goal is not set. The status control MUST still save a value.
- **FR-018**: The manager MUST set the goal status with a fieldset of three visible choices, exactly one selected: On track, At risk, or Off track. The control MUST NOT be a free-text box and MUST NOT hide the unselected choices.
- **FR-019**: Choosing a status MUST save it immediately. The stored value MUST be `on_track`, `at_risk`, or `off_track`. The page MUST show the matching words On track, At risk, or Off track.
- **FR-020**: The system MUST load the saved status from the host file. Sample mode and live mode MUST share that one file. The file MUST NOT be keyed by sprint id. Changing data source MUST NOT clear the file.
- **FR-021**: When the file is missing, empty, or holds a value outside the three allowed tokens, the control MUST start at On track. The system MUST NOT overwrite that file until the manager chooses a status.
- **FR-022**: A successful save MUST write the host file, flush it, and return the saved status. A second save of the same value MUST rewrite the file and MUST succeed.
- **FR-023**: An unknown status MUST be rejected, the file MUST be left unchanged, and the page MUST show an error.
- **FR-024**: A failed write MUST leave the previous file in place, keep the previous status on screen, and show a save error. A crash during write MUST NOT leave a partial JSON file that the next load treats as a valid status. The write MUST go to a temporary file and then replace the target.
- **FR-025**: The goal text MUST NOT be edited on the page and MUST NOT be written back to Jira.

**Attention lists**

- **FR-026**: The system MUST render Blocked, Overdue, Unassigned, and Overloaded in that order. Each heading MUST include the count of rows under it. A count of zero MUST still show the heading and the sentence “Nothing needs attention.”
- **FR-027**: Issue rows MUST show key, summary, assignee or “Unassigned”, and story points. Points that are missing MUST display as an em dash and count as zero. Rows MUST NOT include description, comments, or labels.
- **FR-028**: Issue lists MUST sort by key, ascending. The overloaded list MUST sort by open points descending, then by display name.
- **FR-029**: A counted issue that is not done MUST appear on Blocked when any signal matches: the impediment flag, status name Blocked (case-insensitive), or an inward link whose description is “is blocked by”. The row MUST name every matching signal, once, in the order flag, status, then link, using the row text “Flagged”, “Status: Blocked”, and “Blocked by” plus present linked keys. Linked keys that are absent still make the link signal true, and the row then says “Blocked by” without a key. The issue MUST appear once on Blocked.
- **FR-030**: A counted issue that is not done MUST appear on Overdue when its due date is a calendar date before today. The row MUST show that due date as `YYYY-MM-DD`. A parent MUST NOT inherit a subtask’s due date.
- **FR-031**: A counted issue that is not done MUST appear on Unassigned when it has no assignee. The Assignee column MUST show “Unassigned”. The issue MUST still appear when its story points are missing.
- **FR-032**: A person MUST appear on Overloaded only when that person’s open points are greater than 1.5 times the median open points among people who still have work, and those open points are at least 5. The row MUST show the person, their open points, the median, and the threshold. Median and threshold MUST be shown to one decimal place. The comparison MUST use the exact values.
- **FR-033**: Open points MUST be story points on counted issues that are not done. The median MUST be one number per person with open points greater than zero: the middle value after sorting when the count is odd, and the average of the two middle values when the count is even. Unassigned work MUST NOT create a person on this list.
- **FR-034**: The same issue MAY appear on more than one issue list. It MUST appear once inside each list. A row leaves a list only when the underlying rule stops matching. The lists MUST NOT offer a dismiss action.
- **FR-035**: In live mode each issue key MUST link to the issue on the configured Jira site and open in a new tab. In sample mode the key MUST stay plain text. Display names MUST come from the assignee field.

**Issue eligibility**

- **FR-036**: The system MUST count Story, Bug, and Task, matched on the type name, case-insensitive, and only those exact names. It MUST exclude Sub-task, Subtask, any other type that has a parent, epics, and other custom types, before point sums and before list rules.
- **FR-037**: An issue MUST be done only when its status category is Done. Category names are Done, In Progress, and To Do. The system MUST trust the category field and MUST NOT read resolution, time estimates, or remaining estimate.
- **FR-038**: The system MUST treat null, missing, non-numeric, and negative story points as zero. It MUST keep a stored zero as zero. It MUST sum fractional points as numbers, without rounding to a whole point first. Display of a row MAY show the original number. Totals MUST use the sum.

**Data sources**

- **FR-039**: When `DATA_SOURCE` is unset, the system MUST run in sample mode. `DATA_SOURCE` MUST be `sample` or `live`. Any other value MUST be an error on startup.
- **FR-040**: Sample mode MUST serve a built-in sprint with no credentials. The sample file MUST contain no tokens, emails, or internal URLs. Board id, email, and token MUST be unused in sample mode even if they are present in the environment.
- **FR-041**: Live mode MUST read the active sprint for `JIRA_BOARD_ID` from the Jira Agile API, then that sprint’s issues from the issue search API, including summary, issue type, status, assignee, due date, story points, flag, and issue links. It MUST NOT request comments or attachments.
- **FR-042**: Live mode MUST send basic auth with `JIRA_EMAIL` and `JIRA_API_TOKEN`. If a required live variable is missing, the page MUST name that variable and the backend MUST NOT call Jira. The token value MUST NOT appear in the message, the page, logs, source, or the goal-status file.
- **FR-043**: A live HTTP error or a JSON shape the mapper cannot read MUST show an error in the summary region and no fabricated issue rows. The mapper’s output MUST be the only input to the health rules.
- **FR-044**: The system MUST keep only the active sprint’s issues when a Jira response contains more. The page URL MUST NOT accept a sprint id. The board id MUST come from the environment. The page MUST NOT call a board-list API to offer choices.
- **FR-045**: The default sample sprint MUST be one sprint with a non-empty goal. Separate fixtures MUST cover the other bands, an even load with an empty Overloaded list, one issue on two lists, a subtask, a done issue, an issue with no points, an issue with no due date, a null or whitespace goal, flag-only, status-only, link-only, and flag-plus-link. Those fixtures MUST NOT add extra bands to the default page.

### Non-Functional Requirements

- **NFR-001**: `docker compose up` from the repository root MUST start the React frontend and the Node.js backend. Both MUST bind to localhost. Sample mode MUST need no `.env` file. Shutdown MUST stop those two services and leave no third service.
- **NFR-002**: The frontend MUST call only this backend. In sample mode that path MUST NOT call Jira. Rule tests MUST open no socket to Jira.
- **NFR-003**: Live mode MUST be read-only toward Jira. A failed Jira call MUST leave the last saved goal status untouched.
- **NFR-004**: Credentials MUST come from the environment. A variable already set in the process environment MUST win over the same key in a local `.env`. `.env` and `data/goal_status.json` MUST stay out of git. The token and email MUST NOT be rendered or logged. Error text MAY include the variable name and the HTTP status code.
- **NFR-005**: The goal text and issue summaries MUST be escaped. The page MUST NOT inject unsanitized API text into the document.
- **NFR-006**: Each status MUST be a text label. Color MAY reinforce the label and MUST NOT be the only signal. On a 1280-pixel-wide window the summary MUST be readable without scrolling through the lists. Document order MUST keep the summary before the lists.
- **NFR-007**: Logs for a normal sample request MUST NOT include issue descriptions beyond the key and MUST NOT include environment values. The default start MUST NOT enable directory listing or a debug console that prints request headers.
- **NFR-008**: Labels and empty-state sentences MUST be English. Keyboard use MUST be the browser default for a form and for links.
- **NFR-009**: Automated tests MUST cover the status bands, the four list rules, subtask exclusion, and the goal-status round trip. They MUST use the Node.js test runner, sample fixtures, and no browser. A browser check of sample mode MUST confirm that the summary and four headings render.
- **NFR-010**: `JIRA_SITE_URL` MUST be an HTTPS site origin. The app MUST NOT disable certificate checks.

### Key Entities *(include if feature involves data)*

- **Sprint**: One active sprint. Name, goal text, start date, end date, and its issues. Held for the request that builds the snapshot. Not stored as history.
- **Issue**: A story, bug, or task that survived exclusion. Key, summary, type, status name, status category, story points, assignee, due date, flagged bit, and blocker links.
- **Goal status**: The manager’s judgment of the sprint goal. One of three tokens. The only value this version stores.
- **Attention row**: A derived list line. Either one issue (key, summary, assignee, points, and the reason it matched) or one overloaded person (name, open points, median, threshold).
- **Person load**: An assignee’s open points for the current load, used to compute the median and the overload threshold. Recomputed on each load. Not a roster and not a stored setting.

## UI Screens

This version has one screen. There is no login, no board switcher, no filter, no search, no issue detail page, and no second column.

### Screen: Sprint Health

One main column. The manager opens the frontend URL on localhost. The browser loads this screen and asks the backend for the snapshot.

| Order | Region | What the manager sees |
| --- | --- | --- |
| 1 | Sprint identity | Sprint name. Start date and end date as `YYYY-MM-DD`. Today’s date from the backend, so elapsed percent can be checked by hand. |
| 2 | Points versus time | The text label On track, At risk, or Off track. Completed percent and elapsed percent to one decimal place. Gap in percentage points, with a sign. When dates are missing, the sentence that dates are unavailable, and no percent. |
| 3 | Sprint goal | The full goal text, or the sentence that the goal is not set. A fieldset of three choices, all visible, one selected: On track, At risk, Off track. A save error next to the control when a write fails. |
| 4 | Blocked | Heading `Blocked` and the row count. Each row: key, summary, assignee or “Unassigned”, story points or an em dash, and the matched signals. Empty sentence when the count is 0. |
| 5 | Overdue | Heading `Overdue` and the row count. Each row: key, summary, assignee or “Unassigned”, story points or an em dash, and due date as `YYYY-MM-DD`. |
| 6 | Unassigned | Heading `Unassigned` and the row count. Column header Assignee. Each row shows “Unassigned” plus key, summary, and story points or an em dash. |
| 7 | Overloaded | Heading `Overloaded` and the row count. Each row: person, open points, median to one decimal place, and the 1.5× threshold to one decimal place. |

Empty lists keep their place in this order. They are not removed.

**Ready state.** All seven regions render from a successful snapshot. Sample keys are text. Live keys are links that open in a new tab. The points label and the goal status may disagree; both stay visible.

**Dates unavailable.** Region 2 states that sprint dates are unavailable and omits percents. Regions 3–7 still render.

**Goal text missing.** Region 3 states that the goal is not set. The three choices remain.

**No active sprint.** The screen states that the board has no active sprint. Regions 4–7 are omitted. The goal-status control remains.

**More than one active sprint.** The screen shows an error and does not invent a chosen sprint or issue rows. The goal-status control remains.

**Missing live configuration.** The screen names each missing variable. It shows no issue rows and no token.

**Source error.** A Jira failure or an unreadable payload replaces issue rows with an error in the summary. The error MAY include the HTTP status code. The goal-status control still shows the last good status.

**Save error.** The goal control returns to the previous selection and shows that the new choice was not stored.

**Startup failure.** A missing frontend entry or a missing sample file fails before this screen is served, with a clear file error rather than a blank page.

The screen has no spinner requirement for the sample sprint. Live mode waits on Jira and then shows the result or the error. Status colors may reinforce labels. The label text is present in the page as text.

## API Endpoints

The frontend calls only this backend, under `/api`. The backend calls Jira only in live mode, and only with GET. Health rules run before the JSON is returned. The browser does not receive raw Jira payloads.

### `GET /api/sprint-health`

Returns the current snapshot and the current goal status in one response, so a live error can still render the goal control.

**Request.** No body. No sprint id. The backend reads `DATA_SOURCE` and, in live mode, the Jira environment variables.

**Response `200`.** Every expected page state uses `200` and a `pageState` so the screen can render one contract. `pageState` is one of `ready`, `dates_unavailable`, `no_active_sprint`, `multiple_active_sprints`, `missing_config`, or `source_error`. `dates_unavailable` is a ready snapshot whose points percents are omitted.

| Field | Where it comes from | Where it goes |
| --- | --- | --- |
| `source` | `sample` or `live` | Screen does not need a mode toggle; tests and logs can show the source |
| `asOfDate` | Backend calendar date | Sprint identity region, next to the sprint dates |
| `sprint.name` | Sample file or Jira sprint name | Sprint identity |
| `sprint.startDate`, `sprint.endDate` | Sample file or Jira sprint, as `YYYY-MM-DD`, or null | Sprint identity. Null dates produce `pageState` `dates_unavailable` |
| `sprint.goalText` | Sample file or Jira sprint goal, or null when missing or whitespace | Goal region, or the “goal is not set” sentence |
| `sprint.url` | Optional live sprint URL, otherwise null | Optional name link. Absent in sample mode |
| `pointsVersusTime.label` | Band rule on the exact gap: `On track`, `At risk`, or `Off track` | Points region. Null when dates are missing |
| `pointsVersusTime.completedPercent` | Done points / committed points × 100, then rounded to one decimal for display | Points region |
| `pointsVersusTime.elapsedPercent` | Calendar elapsed rule, rounded to one decimal for display | Points region |
| `pointsVersusTime.gap` | Exact elapsed percent minus exact completed percent | Not shown raw. The screen shows the signed one-decimal gap |
| `pointsVersusTime.gapDisplay` | Signed gap to one decimal. Plus when behind, minus when ahead, `0.0` when zero | Points region |
| `pointsVersusTime.committedPoints`, `pointsVersusTime.donePoints` | Point sums after exclusion | Not required on screen. Present so tests can check the sums |
| `goalStatus.status` | Host file, or `on_track` when the file cannot supply a legal value | Selected choice in the goal fieldset |
| `goalStatus.label` | Display word for that token | Goal region |
| `attention.blocked` | Blocked rule | Blocked list |
| `attention.overdue` | Overdue rule | Overdue list |
| `attention.unassigned` | Unassigned rule | Unassigned list |
| `attention.overloaded` | Overload rule | Overloaded list |
| `error.code` | `no_active_sprint`, `multiple_active_sprints`, `missing_config`, or `source_error` | Replaces list rows |
| `error.message` | Sentence safe to show. No token, no email | Summary error |
| `error.missingVariable` | Name of the first missing live variable, or null | Missing-config message |
| `error.httpStatus` | Jira status code when one exists, or null | Optional detail in the source-error message |

Issue list arrays contain rows already sorted. Each issue row:

| Field | Meaning |
| --- | --- |
| `key` | Issue key |
| `summary` | Issue summary, plain text |
| `assignee` | Display name, or null when unassigned |
| `storyPoints` | Original number, or null when missing |
| `dueDate` | `YYYY-MM-DD` on overdue rows, otherwise null |
| `signals` | Blocked rows only. Ordered list of the signal strings |
| `url` | Jira issue URL in live mode, otherwise null |

Each list object is `{ "count": <number>, "rows": [ ... ] }`. `count` MUST equal `rows.length`. The screen supplies “Nothing needs attention.” when `count` is 0.

Overloaded rows are `{ "name", "openPoints", "median", "threshold" }`. `median` and `threshold` are the exact values. The screen rounds those two to one decimal place for display. `openPoints` is the summed number.

When `pageState` is `no_active_sprint`, `multiple_active_sprints`, `missing_config`, or `source_error`, `sprint` may be null, `pointsVersusTime` is null, and `attention` is null. `goalStatus` is still present. The backend MUST NOT read or write the goal-status file while handling a source failure beyond loading the current status.

**Response `500`.** The backend cannot build a response at all. The screen has no snapshot. This is not used for a Jira miss that can still return `goalStatus`.

### `POST /api/goal-status`

The only write in the product. The fieldset submits as soon as the manager changes the choice.

**Request body.**

```json
{ "status": "on_track" }
```

`status` MUST be `on_track`, `at_risk`, or `off_track`.

**Response `200`.** The file has been replaced and flushed.

```json
{ "status": "at_risk", "label": "At risk" }
```

The screen selects that choice.

**Response `400`.** The value is unknown. The file is unchanged. Body: `{ "error": "invalid_status" }`. The screen keeps the previous choice and shows an error.

**Response `500`.** The replace failed. The previous file remains. Body: `{ "error": "save_failed", "status": "<previous token>", "label": "<previous label>" }`. The screen shows the previous status and a save error.

There is no other route that writes sprint data, and no route that writes to Jira.

### Live inbound data (backend to Jira)

These calls are not part of the frontend API. They run only when `pageState` is being built in live mode and the four variables are present.

| Call | Data sent | Data used |
| --- | --- | --- |
| Agile API, active sprint for `JIRA_BOARD_ID` | Site origin, basic auth, board id | Sprint name, goal, start, end, and the single active sprint identity. Zero or many active sprints become page errors |
| Issue search for that sprint | The fields summary, issuetype, status, assignee, duedate, story points, flag, and issue links | Mapped into Issue records, then discarded as raw JSON |

Auth is `JIRA_EMAIL` plus `JIRA_API_TOKEN`. The story-point value MUST be the Jira story point field. A differently named numeric field is not mapped. The flag MUST be the impediment flag. Custom blocked checkboxes are ignored unless they appear as that flag, the status name Blocked, or an “is blocked by” link.

### Sample inbound data

Sample mode reads the built-in JSON instead of Jira. The file has the sprint name, goal, start, end, and issues in the same model. ISO dates. Null for a missing assignee, points, or due date. The backend maps that file through the same rules as a live sprint.

## Data Model

This version has no database. Sample data and the goal-status file are local JSON. PostgreSQL, SQLite, and any hosted store are outside this version. Nothing in the snapshot is kept as history. Restarting the backend drops memory and rereads the source and the host file.

The model below is what the backend stores, what it holds for one request, and what it refuses to store.

### Stored: Goal status

One JSON object on the host at `data/goal_status.json`, mounted into the backend. UTF-8. Created on the first successful save. The parent `data/` directory is created if it is missing at save time. Git ignores the file.

| Field | Type | Allowed values | Notes |
| --- | --- | --- | --- |
| `status` | string | `on_track`, `at_risk`, `off_track` | The only field. One object for the single sprint on the page |

```json
{ "status": "on_track" }
```

Persistence rules:

- The object is not keyed by sprint, board, or user.
- A missing, empty, or illegal file is treated as On track for display and is not rewritten until a successful save.
- The write is atomic: write a temporary file, then replace the target, then return.
- The file MUST NOT contain the API token, the account email, the site URL, issue payloads, or a history of previous statuses.
- Two overlapping saves on one machine: the last successful replace wins.

### Not stored: Sprint model (one request)

Mapped from sample JSON or from Jira before any rule runs. Dropped after the response is sent.

**Sprint**

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Plain text |
| `goalText` | string or null | Null when missing or whitespace |
| `startDate` | calendar date or null | |
| `endDate` | calendar date or null | |
| `issues` | list of Issue | Active sprint only |

**Issue**

| Field | Type | Notes |
| --- | --- | --- |
| `key` | string | |
| `summary` | string | |
| `typeName` | string | Eligibility uses this name |
| `parentSet` | boolean | Used only for the subtask exclusion rule |
| `statusName` | string | Blocked signal uses this name |
| `statusCategory` | string | `Done`, `In Progress`, or `To Do`. Done means this field is Done |
| `storyPoints` | number or null | Null means “no points” after the zero rule |
| `assigneeAccountId` | string or null | Absence of account and display name means unassigned |
| `assigneeDisplayName` | string or null | Shown as-is. Not parsed from an email |
| `dueDate` | calendar date or null | Null when missing, empty, or unparseable |
| `flagged` | boolean | True only for the impediment flag. Missing field is false |
| `blockedByKeys` | list of string | Keys from “is blocked by” links. A link with no key still sets the signal; the list may be empty while the signal is true |

**Person load** (derived, not stored)

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Assignee display name |
| `openPoints` | number | Sum of story points on that person’s not-done counted issues |

The median and the threshold are computed from the current person-load list on that request. They are not a team setting.

### Explicitly not stored

- Jira credentials and the site URL, except as process environment.
- Raw Jira responses, comments, attachments, and descriptions beyond the summary shown on the page.
- Yesterday’s snapshot, velocity, or a trend.
- A team roster, a board list, or a user account.
- Edits to story points, due dates, assignees, or the goal text.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: With no Jira credentials, `docker compose up` serves the sample sprint on the localhost URL stated in the README. The page shows points-versus-time status, sprint goal text, goal status, and the four attention lists from the backend.
- **SC-002**: A fixture where completed percent equals elapsed percent is labeled On track. A fixture 15 percentage points behind is labeled At risk. A fixture more than 15 behind is labeled Off track. The default page still shows one sprint and one band.
- **SC-003**: On the sample sprint, Blocked, Overdue, Unassigned, and Overloaded match the list rules, including an issue with no due date absent from Overdue, a subtask absent from every list and from point totals, a blocked issue listed once with every matched signal, and an issue that matches two lists present on both.
- **SC-004**: Overloaded is empty when no person meets both thresholds, including a person who has at least 5 open points but is not strictly above 1.5 times the median, and including a sprint where only one person has open work.
- **SC-005**: An issue with no story points adds zero to the commitment and to open points, and it still appears on a list when a list rule matches.
- **SC-006**: When the sprint goal text is missing, the page says the goal is not set, and the status control still saves. After a successful save, a browser refresh and a backend restart both show that status. A missing or unreadable status file starts the control at On track.
- **SC-007**: With `DATA_SOURCE=live` and the Jira variables set, the same page shows the one active sprint of that board. Live mode with no active sprint shows a clear message and does not fall back to sample data. A Jira error leaves the saved goal status unchanged.
- **SC-008**: The API token is not visible in the page, the repo, application logs, or the goal-status file.
- **SC-009**: Automated tests for the status bands, the four list rules, subtask exclusion, and the goal-status round trip pass without network access and open no socket to Jira.
- **SC-010**: A manager can tell both health signals and see all four headings, including empty ones, from a single page load, with status words present as text.

## Assumptions

- The reader is one manager on one machine. The team is whoever is assigned on the sprint. The app has no separate roster.
- An active sprint is the sprint Jira marks active on the one configured board. This version expects a single active sprint.
- Sample mode is part of the contract, not a temporary stub. The default run needs no token.
- The goal status is a human judgment. The points gap does not set it.
- The Jira story point field is the only points field. Time estimates are not a substitute.
- The blocked flag is the Jira impediment flag. The link signal uses the inward description “is blocked by”.
- Locale for “today” is the backend container’s local calendar. Display dates are ISO so the sample and the page can be compared.
- Browser support is a current Chrome, Edge, or Firefox. The page is usable at a normal laptop width and remains health-first in a narrow window.
- Live mode depends on Jira being reachable from that machine. There is no offline cache and no retry queue.
- The implementation may page the Jira search internally until the sprint’s issues are loaded. The screen does not paginate.
- A personal API token with permission to read the board is enough for the live path. The project does not provision that permission.
- The README states the localhost URL, the live variable names, the read-only token permission, and the goal-status path and the three tokens. It points at the product rules and does not invent a second ruleset.

## Out of Scope

- More than one team or board, a board switcher, past sprints, history, and trend charts.
- Confluence, meeting notes, and release checklists.
- Counting subtasks toward points or lists.
- Treating a missing due date, or a sprint that is about to end, as overdue.
- Creating or updating Jira issues, assignees, comments, or the sprint goal text.
- A login screen, user accounts, or a hosted multi-user deployment.
- Email, Slack, scheduled digests, and notifications when a list changes.
- Editing story points, due dates, or assignees on the dashboard.
- A combined health score, working-day calendars, team timezones, hour-based capacity, and velocity forecasts.
- Custom workflows beyond the three blocked signals and the Done status category.
- Mobile applications, browser extensions, and Jira marketplace apps.
- CSV import or export, and PDF reports.
- Internationalization of the labels.
- Mapping a non-standard story-point custom field.
- A database, a background worker, a queue, or a cache server.

## Commit History
42b3c68 (HEAD -> main) All tests passed
38ea627 (origin/main) feat: initialize frontend with Vite, React, and basic structure
5868375 Add tasks for Sprint Health Dashboard implementation
06870c3 Add constitution and specification documents for Jira/Confluence Automation project
492dc6c Update project specification to reflect new tech stack and architecture
b923d2b chore: project skeleton for prototype
20d3af7 Add bulk processing script and documentation for file transformations
c32dcdd Update .gitignore and backlog documentation with new entries and clarifications
a2fe74f Enhance backlog documentation with detailed coding agent descriptions for task execution
a4a88f9 Update backlog with task identifiers for improved tracking and organization of setup steps
d573be8 Remove unused files: deleted calculator, main, hello, and TODO files to clean up the project structure.
31bb0f4 Add MCP tools for echoing messages and retrieving timestamps
5c85939 Add new tools and documentation for compound interest and story points normalization
548e92b Add new rules and instructions for calculating compound interest, elapsed percent, and story points normalization
0706798 Add sample sprint data and update Jira issue fetching instructions
6987e67 Update Jira issue fetching instructions and add module 10 report
116398b Add initial instruction files for project orchestration
a130b32 Record the sprint health backlog and status reports so the planned dashboard work is in version control.
f7c0b27 Expand the sprint health dashboard spec so the first version can be built and checked.
d10640e Add the sprint health dashboard project spec.
c542075 next exceisze
c1beab0 Add multiplication function and update main and README
8544304 Add initial files for a simple calculator project

## Commit Count
23

## Project Files
.cursor/rules/main.mdc
.cursor/rules/mcpyrex.mdc
.cursor/rules/to-calculate-compound-interest.mdc
.cursor/rules/to-create-status-report.mdc
.cursor/rules/to-creating-instructions.mdc
.cursor/rules/to-elapsed_percent_and_health gap.mdc
.cursor/rules/to-fetch-jira-issues.mdc
.cursor/rules/to-use-compute_committed_done_points_completed percent.mdc
.cursor/rules/to-use-normalize_story_points.mdc
.gitignore
PROJECT_IDEAS.md
README.md
REQUIREMENTS.md
backend/Dockerfile
backend/package-lock.json
backend/package.json
backend/sample/fixtures/.gitkeep
backend/sample/fixtures/at-risk.json
backend/sample/fixtures/done-issue.json
backend/sample/fixtures/even-load.json
backend/sample/fixtures/flag-only.json
backend/sample/fixtures/flag-plus-link.json
backend/sample/fixtures/link-only.json
backend/sample/fixtures/no-due-date.json
backend/sample/fixtures/null-points.json
backend/sample/fixtures/off-track.json
backend/sample/fixtures/one-issue-two-lists.json
backend/sample/fixtures/status-only.json
backend/sample/fixtures/subtask-under-story.json
backend/sample/fixtures/whitespace-goal.json
backend/sample/sprint.json
backend/src/clients/jira-client.js
backend/src/config.js
backend/src/db/job-runs.test.js
backend/src/db/migrate.js
backend/src/db/migrations/001_create_job_runs.sql
backend/src/db/queries/job-runs.js
backend/src/goal-status.js
backend/src/health.js
backend/src/jira-client.js
backend/src/routes/goal-status.js
backend/src/routes/sprint-health.js
backend/src/server.js
backend/src/services/attention-lists.js
backend/src/services/decimal-amount.js
backend/src/services/eligibility.js
backend/src/services/goal-status.js
backend/src/services/live-sprint-health.js
backend/src/services/points-versus-time.js
backend/src/services/record-job-run.js
backend/src/services/sprint-health.js
backend/src/sprint-model.js
backend/test/clients/jira-client.test.js
backend/test/goal-status.test.js
backend/test/health.test.js
backend/test/routes/goal-status.test.js
backend/test/services/attention-lists.test.js
backend/test/services/decimal-amount.test.js
backend/test/services/eligibility.test.js
backend/test/services/goal-status.test.js
backend/test/services/live-sprint-health.test.js
backend/test/services/points-versus-time.test.js
backend/test/services/sample-sprint.test.js
backlog.md
data/sample_sprint.json
docker-compose.yml
frontend/.dockerignore
frontend/Dockerfile
frontend/index.html
frontend/package-lock.json
frontend/package.json
frontend/src/Dashboard.jsx
frontend/src/api/sprint-health-api.js
frontend/src/components/AttentionList.jsx
frontend/src/components/GoalStatusFieldset.jsx
frontend/src/main.jsx
frontend/src/pages/SprintHealth.jsx
frontend/src/styles.css
frontend/src/styles/global.css
frontend/test/api/sprint-health-api.test.js
frontend/vite.config.js
instructions/calculate-compound-interest.agent.md
instructions/create-status-report.agent.md
instructions/creating-instructions.agent.md
instructions/elapsed_percent_and_health gap.agent.md
instructions/fetch-jira-issues.agent.md
instructions/main.agent.md
instructions/use-compute_committed_done_points_completed percent.agent.md
instructions/use-normalize_story_points.agent.md
project_spec.md
reports/example.md
reports/instructions.md
reports/template.md
requirements.txt
spec/analyze.md
spec/clarify.md
spec/constitution.md
spec/plan.md
spec/specification.md
spec/tasks.md
tools/bulk_process_files.py
tools/compound_interest.py
tools/compute_committed_done_points_completed percent.py
tools/elapsed_percent_and_health gap.py
tools/mcp-echo.ps1
tools/mcp-get-time.ps1
tools/normalize_story_points.py
work/module-08-report.md
work/module-09-report.md
work/module-10-report.md
work/module-12-report.md
work/module-13-report.md
work/module-14-report.md
work/module-15-fixtures/alpha.txt
work/module-15-fixtures/beta.txt
work/module-15-fixtures/gamma.txt
work/module-15-report.md
work/module-16-report.md
