# Analysis: Sprint Health Dashboard tasks

**Sources**: `spec/tasks.md` (34 tasks), `spec/plan.md`, `spec/specification.md` (Draft), with `spec/clarify.md` used only to see which conflicts the plan already claims to close.

**Date**: 2026-10-09

The task list can be built in the written order for the sample page. It is not yet a single contract. `spec/plan.md` records the clarify decisions, and the tasks mostly follow that plan. `spec/specification.md` was not amended, so it still states the opposite rule in several places. A smaller set of gaps is inside the plan and the tasks themselves. Those will fork the job-run row, the goal-file mount, the source-error sentence, and the overloaded JSON if they are left to the implementer.

## Verdict

| Check | Result |
| --- | --- |
| Task order | Usable. Four dependency edges do not match the phase rules that introduce them. |
| Complexity | 5 low, 21 medium, 8 high. The high tasks are the decimal and band math, the snapshot API, Overloaded, the fixture page, the goal-file replace, and the Jira mapper and error matrix. |
| Plan versus tasks | Aligned on rules, pins, and phase order. Divergent on the goal mount, the HTTP-status sentence, job-run columns, and which tasks block a milestone. |
| Specification versus plan | Not aligned. The Draft spec still forbids the database, still describes two Compose services, and still states several screen and number rules the plan reversed. |
| Ready to implement | After the open items in “Contradictions” and “Missing artifacts” are written into one of the three files. |

## How to read the task rows

**Complexity** is the chance of a wrong implementation, not the line count. Low is a pin, a file, or a smoke check. Medium is several rules or one integration. High is arithmetic, mapping, or I/O where two readings both look compliant.

**Depends on** is the edge written in `spec/tasks.md`. Extra gates the phase text implies, but the edge does not enforce, are under “Dependency holes”.

## Phase 1 — Backend setup

### T1.1 Pin the backend

| | |
| --- | --- |
| Complexity | Low |
| Depends on | none |
| Risks | A lockfile that resolves Express or `pg` to a different version than 5.2.1 and 8.23.1. Adding a helper package here violates the constitution before complexity tracking can record it. |

### T1.2 Run PostgreSQL and the backend in Compose

| | |
| --- | --- |
| Complexity | Medium |
| Depends on | T1.1 |
| Risks | The official `postgres` image exits without `POSTGRES_PASSWORD`. Neither the plan nor this task sets the user, password, database name, or the `DATABASE_URL` string. The healthcheck command is unnamed. The acceptance criterion requires a listening backend, and `backend/src/server.js` is not created until T1.5. |

### T1.3 Create `job_runs` and migrate on boot

| | |
| --- | --- |
| Complexity | Medium |
| Depends on | T1.2 |
| Risks | Column names are fixed; SQL types, nullability, and the primary key are not. A second boot can be satisfied with `IF NOT EXISTS` and no migration ledger, which will not evolve the table later. Point columns are “decimal totals” in the plan and untyped here. |

### T1.4 Load configuration once

| | |
| --- | --- |
| Complexity | Medium |
| Depends on | T1.2 |
| Risks | Node.js does not load `.env`. A `dotenv` package is not in complexity tracking, so the loader has to be local. The file’s path (repository root versus `backend/`) is unnamed. This task reports `DATA_SOURCE` and does not exit; a reader can still treat `Live` as live. The exit belongs to T3.1.7. |

### T1.5 Stub the two API routes

| | |
| --- | --- |
| Complexity | Medium |
| Depends on | T1.3, T1.4 |
| Risks | The stub omits `sprint`, `asOfDate`, and `pointsVersusTime`. Phase 2 still fills seven regions from that JSON. `POST /api/goal-status` returns 400 for a valid token until T3.3.2, which is intentional and easy to “fix” early. Logging is constrained (“no environment values”) and no logger is specified. |

### T1.6 Replace the README and ignore local files

| | |
| --- | --- |
| Complexity | Low |
| Depends on | T1.5 |
| Risks | The README becomes the operator contract for the URL, `TZ`, four Jira names, and the goal path. A partial replacement leaves the calculator instructions in force. Milestone M1 does not require the frontend. |

## Phase 2 — Frontend setup

### T2.1 Pin the frontend

| | |
| --- | --- |
| Complexity | Low |
| Depends on | M1 |
| Risks | The lockfile must pin React 18.3.1, React DOM 18.3.1, and Vite 8.3.4 with no router, data library, or CSS framework. |

### T2.2 Serve the frontend and proxy `/api`

| | |
| --- | --- |
| Complexity | Medium |
| Depends on | T2.1 |
| Risks | Vite applies `server.proxy` to the dev server and `preview.proxy` to `vite preview`. Configuring only one leaves the Compose URL without `/api`. The image must build, then preview on `0.0.0.0:5173`. `vite.config.js` and `index.html` are not in the plan tree or this task. |

### T2.3 Render the seven-region skeleton

| | |
| --- | --- |
| Complexity | Medium |
| Depends on | T2.2 |
| Risks | Document order and the disabled fieldset are the whole UI contract, and no automated test locks them. Placeholder copy is unspecified, so it can collide with the real sentences introduced later. |

### T2.4 Call the stub API

| | |
| --- | --- |
| Complexity | Medium |
| Depends on | T2.3 |
| Risks | The only frontend test asserts the POST body and path. Band formulas must stay out of the client file. The failure sentence is specified; the success mapping onto regions 1 and 2 is not, because the stub has no sprint. Milestone M2 is a manual browser check. |

## Phase 3 — Feature 1, sample sprint snapshot

### T3.1.1 Add decimal arithmetic

| | |
| --- | --- |
| Complexity | High |
| Depends on | M2 |
| Risks | Half-up on negative values and on values just above a one-decimal boundary is the difference between At risk and Off track. The exact value must survive display rounding. No decimal package is allowed. IEEE `0.1 + 0.2` is the regression this task exists to prevent. |

### T3.1.2 Decide which issues count

| | |
| --- | --- |
| Complexity | Medium |
| Depends on | T3.1.1 |
| Risks | Trim and case rules are easy to under-apply. A Story with `parent` set must count. `User Story`, Epic, `Sub-task`, and `Subtask` must not. A status named Done in another category must not count as done. The Draft spec’s FR-036 can still be read the other way; this task follows the plan. |

### T3.1.3 Compute points versus time

| | |
| --- | --- |
| Complexity | High |
| Depends on | T3.1.2 |
| Risks | Same-day sprints, the start-date clamp, end-before-start, and zero commitment with a bad date are all specified here and still contradict unqualified sentences in the Draft spec. The worked Off-track case (elapsed display `33.3`, gap display `15.0`) must use the exact gap, not the printed one. Injected `today` must not leak into the running server, which uses `TZ`. |

### T3.1.4 Add the default sample sprint

| | |
| --- | --- |
| Complexity | Low |
| Depends on | T3.1.3 |
| Risks | The expected totals (committed 18, done 2, completed `11.1`, gap display `-11.1`, On track on `2026-10-01`) are a calculation check, and the JSON property names are not specified. Assignee account ids are required later for Overloaded and are not in the plan’s sample table. |

### T3.1.5 Return the sample snapshot

| | |
| --- | --- |
| Complexity | High |
| Depends on | T3.1.4 |
| Risks | This task replaces the stub and owns `pageState`, `gap` versus `gapDisplay`, and `dates_unavailable`. Attention lists stay empty. A sprint-id query must still be ignored. `label` is the band. The process calendar date is the server’s `today`; tests pass a fixed one. |

### T3.1.6 Store each snapshot load

| | |
| --- | --- |
| Complexity | Medium |
| Depends on | T3.1.5 |
| Risks | Insert-after-compute and 500-on-failure are clear. The acceptance list omits `blocked_count`, `overdue_count`, `unassigned_count`, `overloaded_count`, `error_code`, `http_status`, `started_at`, and `finished_at`, which the plan’s `job_runs` contract includes. No later task adds them. The database test needs PostgreSQL 15.19 on `127.0.0.1:5432`. |

### T3.1.7 Fail startup on a bad sample setup

| | |
| --- | --- |
| Complexity | Medium |
| Depends on | T3.1.5 |
| Risks | `livee`, a missing sample file, and non-object JSON exit 1. A valid object with missing sprint fields is unclassified. Stderr must name the file or the value and must not include a secret. Unset `DATA_SOURCE` must still mean sample. |

### T3.1.8 Show sprint identity and the points signal

| | |
| --- | --- |
| Complexity | Medium |
| Depends on | T3.1.5 |
| Risks | The page must show API strings and must not recompute them. On the wall clock of 2026-10-09 the default sprint is not the On-track fixture (that fixture is injected `2026-10-01`). Milestone M3.1 mixes those two checks. `dates_unavailable` and a whitespace goal are specified; the four lists stay on the empty stub. |

## Phase 3 — Feature 2, attention lists

### T3.2.1 Build the Blocked list

| | |
| --- | --- |
| Complexity | Medium |
| Depends on | M3.1 |
| Risks | `blockedByKeys: null` is not blocked. `blockedByKeys: []` is blocked and the row says `Blocked by` with no key. An outward “blocks” link does not match. Signals are ordered and de-duplicated. Sort is UTF-16 code units, so `SAM-10` precedes `SAM-9`. |

### T3.2.2 Build the Overdue list

| | |
| --- | --- |
| Complexity | Medium |
| Depends on | T3.2.1 |
| Risks | Due date equal to `today` is absent. Unparseable dates are absent. “A parent does not receive a subtask’s due date” is a mapping rule; this task builds a list from an already mapped issue. The rule can be dropped if the test only passes issues that were never subtasks. |

### T3.2.3 Build the Unassigned list

| | |
| --- | --- |
| Complexity | Medium |
| Depends on | T3.2.1 |
| Risks | An account id with a blank display name is assigned. A display name `Unassigned` on a real account is assigned. A done issue stays in the point totals and off this list. Null points still produce a row with `storyPoints: null`. |

### T3.2.4 Build the Overloaded list

| | |
| --- | --- |
| Complexity | High |
| Depends on | T3.1.1, T3.2.1 |
| Risks | Group by `assigneeAccountId`. Include only when open points are greater than `1.5 × median` and at least 5. Equality and `4.9` are out. One person yields an empty list. Two account ids with one display name stay two people. A blank name renders as `Unassigned` and does not join the Unassigned issue list. Sort is exact open points descending, then `en` base sensitivity. The task requires exact `median` and `threshold` plus unnamed display fields. The spec’s overloaded object has no display fields, and it says the screen rounds those two numbers. |

### T3.2.5 Serve the lists on the sample page

| | |
| --- | --- |
| Complexity | High |
| Depends on | T3.2.2, T3.2.3, T3.2.4 |
| Risks | Many fixtures, none of them the default page, and no `asOfDate` is given for the band fixtures. Default headings on `2026-10-01` are `Blocked (1)`, `Overdue (1)`, `Unassigned (1)`, `Overloaded (0)`. SAM-1 is on two lists. Rendering rules cover the em dash U+2014, a stored zero, a negative point, and stripped trailing zeros. The screen must not sort again. The plan’s milestone also asks for a keyless blocker link and a story with a parent; the fixture list in this task does not name those files. |

## Phase 3 — Feature 3, goal status

### T3.3.1 Store the goal status in the host file

| | |
| --- | --- |
| Complexity | High |
| Depends on | M3.2 |
| Risks | The replace must be unique, flushed, and atomic on Windows and on Linux. A failed first save must not create the file and must report `on_track`. A failed later save must keep the previous file. Extra keys are ignored only when `status` is an exact token. The path is `/app/data/goal_status.json`. The plan also describes a single-file bind of `./data/goal_status.json`, which Docker turns into a directory when the file is absent. This task matches the directory mount in T1.2. |

### T3.3.2 Accept the goal-status POST

| | |
| --- | --- |
| Complexity | Medium |
| Depends on | T3.3.1 |
| Risks | 200, 400, and 500 bodies are fixed. Display words are not tokens. The sample GET must return the saved status. A live GET that returns the same file is not an acceptance criterion until the error states in T3.4.3. |

### T3.3.3 Save from the goal fieldset

| | |
| --- | --- |
| Complexity | Medium |
| Depends on | T3.3.2 |
| Risks | One radio selected, all three visible, immediate POST on change. 400 and 500 show “The goal status was not saved.” and keep the previous selection. Clicking the selected radio need not save again; a second POST of the same token is an API rule from T3.3.1. Goal text is plain, untruncated, and keeps newlines. HTML in the goal must not be inserted as HTML. |

## Phase 3 — Feature 4, live Jira board

### T3.4.1 Reject a bad live configuration before calling Jira

| | |
| --- | --- |
| Complexity | Medium |
| Depends on | M3.3 |
| Risks | Check order is fixed, and only the first failure is returned. Empty and unset are both missing. HTTPS origin rules (userinfo, path, query, hash, one trailing slash, `http`) are precise. The page copy is a frontend change this task does not name a file for. Sample mode must ignore the four variables. The message contains the name and not the value. |

### T3.4.2 Map one active sprint from Jira

| | |
| --- | --- |
| Complexity | High |
| Depends on | T3.4.1 |
| Risks | This is the only module that may open a socket to Jira, and the default suite must not. Pagination is “pages of 50”; `startAt`, `total`, and the next-page query are unnamed. A later page failure discards issues already read. Story points resolve by field name (`Story Points` or `Story point estimate`) via `GET /rest/api/3/field`. The impediment JSON shape is only “Impediment”. Link matching is trim and case-insensitive on the inward description. Date-only strings stay; datetimes use `TZ`. One missing key is skipped; an unreadable array fails the snapshot. |

### T3.4.3 Return live errors without sample rows

| | |
| --- | --- |
| Complexity | High |
| Depends on | T3.4.2 |
| Risks | Six page states share one route. Zero and many active sprints must not invent a sprint or sample rows. DNS, timeout, and TLS set `httpStatus` null. The screen appends ` HTTP 404.` only for status 404. The plan’s sentence table says to append that text whenever `httpStatus` is set, which would mislabel every other status. Error responses still insert `job_runs` and still return `goalStatus`. A 500 from a failed insert has no snapshot body. |

### T3.4.4 Link live keys and show the waiting sentence

| | |
| --- | --- |
| Complexity | Medium |
| Depends on | T3.4.3 |
| Risks | Live links are `{origin}/browse/{key}` with `target="_blank"` and `rel="noopener noreferrer"`. Sample keys stay text. The sprint name is not a link. “Loading the sprint.” shows only during a live GET. The four error states also show “The goal is not set.” because `sprint` is null. That sentence is what the plan chose; the spec’s error-screen paragraphs do not all say it. Milestone M3.4 is stubbed tests, not a live site. |

## Phase 4 — Integration and testing

### T4.1 Run the full automated suite

| | |
| --- | --- |
| Complexity | Medium |
| Depends on | M3.4 |
| Risks | Phase 4 must not add behavior, and it must cover every row of the plan’s automated-test table. Several of those rows are not named in a feature-task acceptance criterion (equal percents, a gap just above 0, an exact gap of 15, a non-numeric point on a row, an error `job_runs` row with no secrets). The suite then fails here, and the fix has to go back to the owning feature task. |

### T4.2 Boot the sample stack with no `.env`

| | |
| --- | --- |
| Complexity | Low |
| Depends on | T4.1 |
| Risks | Compose must inject `DATABASE_URL` and still start with no `.env`. `docker compose down` must remove frontend, backend, and PostgreSQL. That third service contradicts NFR-001 in the Draft spec. The plan already chose the constitution. |

### T4.3 Check logs and secrets

| | |
| --- | --- |
| Complexity | Medium |
| Depends on | T4.2 |
| Risks | Allowed log fields are keys, `pageState`, and the word `sample`. Summaries, descriptions, emails, tokens, and raw environment values are forbidden. There is no automated assertion; the check is observational. The constitution re-check belongs here, and milestone M4 does not depend on this task. |

### T4.4 Walk the page in a browser

| | |
| --- | --- |
| Complexity | Medium |
| Depends on | T4.2 |
| Risks | Manual, current Chrome, Edge, or Firefox, about 1280 pixels wide, no browser-driver package. The script covers the sample page and the goal round trip. It does not open a live board, a missing-config screen, or a Jira error. Milestone M4 still says SC-001 through SC-010 hold. SC-007 and SC-008 are not exercised by this walk. |

## Dependency holes

The preamble says a task starts only after the tasks it depends on are done, and that Phase 3 finishes each feature before the next. These edges do not say that.

| Edge as written | What the phase text requires | What can start too early |
| --- | --- | --- |
| T1.2 depends on T1.1 | A listening backend | T1.2 is accepted before T1.5 creates `server.js` |
| T3.2.1 depends on M3.1, which is T3.1.8 | Feature 1 finished, including the job-run insert and the startup failures | Lists can start while T3.1.6 and T3.1.7 are open |
| T4.4 depends on T4.2 | Milestone M4, including SC-008 | The browser milestone can be marked done before T4.3 |
| T3.2.2 and T3.2.3 depend only on T3.2.1 | None beyond that | Those two lists can proceed in parallel. That one is consistent |

T1.3 and T1.4 both depend only on T1.2, and T1.5 waits for both. That split is sound.

## Gaps

Items the plan’s clarify table treats as closed are listed only when the tasks or the plan still leave the implementer a choice.

1. **`job_runs` contents after Feature 1.** T1.3 creates sixteen columns. T3.1.6 requires a subset. No task requires the four attention counts, `error_code`, `http_status`, or the two timestamps. T3.4.3 says an error inserts a row and does not say which columns are filled.
2. **Overloaded numbers on the wire.** T3.2.4 asks for exact `median` and `threshold` and for display fields rounded in the backend. The specification’s row is `{ "name", "openPoints", "median", "threshold" }` and says the screen rounds median and threshold. The display property names are not chosen.
3. **Sample JSON schema.** The default sprint is a table of human columns, not a JSON object. Account ids, `parentSet`, `blockedByKeys`, and status-category keys are required by later tasks and absent from the table. G-09 asked for a schema; the plan did not add one.
4. **Fixture clock.** Only the default sprint names an injected today (`2026-10-01`). The “other bands” files cannot hit At risk or Off track unless each file’s `asOfDate` is fixed. “Other bands” may be one file or two.
5. **Jira page request.** Paths, `maxResults=50`, timeout, and auth style are named. The follow-up query (`startAt` or a next-page URL), the `fields` parameter format, and the impediment JSON shape (`{ "value": "Impediment" }` versus an array) are not.
6. **PostgreSQL bootstrap.** Image tag, host port, and “`DATABASE_URL` points at `postgres`” are named. User, password, database name, and the URL are not. The image will not stay up without a password.
7. **Goal mount shape.** T1.2 and the phase-1 plan mount the directory `./data` at `/app/data`. The plan’s runtime contract also bind-mounts the file `./data/goal_status.json`. Those are different Docker mounts. The directory mount matches T3.3.1.
8. **500 body.** T3.4.3 says a GET 500 has no snapshot body. It does not say whether the body is empty or `{ "error": ... }`. The frontend treats any failed GET as “The sprint could not be loaded.”
9. **Startup versus request for bad sample fields.** Non-object JSON exits. A sprint object missing `startDate` is `dates_unavailable` on the request. The boundary between those two failures is only implied.
10. **Live success and the goal file.** T3.3.2 checks the saved status on the sample GET. T3.4.3 checks `goalStatus` on live errors. A successful live snapshot returning the same file is assumed, not required.
11. **Frontend tests stop at the client.** Error screens, the loading sentence, link attributes, and the seven-region order have no Node test. NFR-009 forbids a browser in the suite. T4.4 does not walk the live error screens, so those strings are locked only by manual reading of the tasks.
12. **Automated-test table versus feature acceptance.** The plan forbids dropping a case and forbids adding behavior in Phase 4. Equal percents, a gap just above 0, an exact gap of 15, and a secret-free error job row are in the table and not in a feature acceptance list.
13. **`.env` loader.** T1.4 requires process environment to win over `.env`. The parser, the file location, and the decision not to add a package are not written down.

## Contradictions

### Still open between the plan and the tasks

| Topic | Plan | Tasks | Practical reading |
| --- | --- | --- | --- |
| Source-error suffix | Append ` HTTP 404.` when `httpStatus` is set (`spec/plan.md` screen table) | Append that suffix only when the status is 404 (T3.4.3) | The task is the one that matches a 503. The plan sentence labels every status as 404. The spec only says the error may include the status code. |
| Goal file mount | File bind of `./data/goal_status.json`, and also a directory mount of `./data` | Directory mount only (T1.2) | Use the directory mount. A file bind of a missing path becomes a directory and breaks the first save. |
| Milestone M3.1 | Feature 1 includes the job-run insert and the startup exit | M3.1 is T3.1.8 and does not depend on T3.1.6 or T3.1.7 | Feature 2 is unblocked while two Feature 1 tasks are open. |
| Milestone M4 | SC-001 through SC-010 after the log check and the browser check | M4 is on T4.4, which does not depend on T4.3 | SC-008 can be unchecked when M4 is marked done. |
| Sprint name link | Omitted | Not a link in either mode (T3.4.4) | These agree with each other. The spec still says the live sprint name may link. |

### Specification text the plan reversed and did not edit

`spec/clarify.md` records a decision for each of these. `spec/plan.md` implements that decision. `spec/specification.md` still states the old rule. An implementer who treats the Draft spec as binding will fail the tasks.

| Id | What the spec still says | What the plan and tasks build |
| --- | --- | --- |
| C-02, C-03 | “This version has no database.” Out of scope includes “A database”. NFR-001: shutdown leaves no third service. | `postgres:15.19`, `job_runs`, three Compose services. |
| C-04 | FR-036 excludes “any other type that has a parent,” which can drop a story under an epic. | Story, Bug, and Task count when `parent` is set. |
| C-06 | The missing-configuration screen “names each missing variable.” | One `error.missingVariable`, first failure in a fixed order. |
| C-07 | `project_spec.md` shows negative points as missing. The spec says that file wins on disagreement. FR-038 allows the original number. | The row shows the negative number. The sum adds zero. |
| C-10 | Assumptions: today is the container calendar. | Today is the host calendar. Compose passes `TZ`. |
| C-11 | Error screens do not all use the missing-goal sentence. | The four error states show “The goal is not set.” |
| U-01 | Edge case: display rounding cannot move a 15.0 case into Off track. User story 1 scenario 5: zero commitment is On track, with no date exception. | A printed `15.0` can be Off track. Missing dates beat the zero-commitment rule. |
| U-01, U-06 | The screen rounds median and threshold. | The backend rounds display values. The screen does not recompute the band. |
| Precedence | The spec adds no behavior, and `project_spec.md` wins. | The plan says the API chapter and the clarify justifications win. |

The constitution’s Sync Impact Report is still in the ratified file. Governance says that report is removed before the file is committed. That is a constitution hygiene gap, not a task gap.

## Missing artifacts

Present in the plan’s tree or required by an acceptance criterion, and not named as a file in the tasks:

| Artifact | Why it is required | Where it should be named |
| --- | --- | --- |
| `frontend/index.html` | Vite cannot serve T2.2 without it | Phase 2 |
| `frontend/vite.config.js` (or equivalent) | Dev and preview proxy for `/api` | T2.2 |
| Backend start script and Docker `CMD` | T1.2 needs a listening process | T1.1 or T1.2 |
| `backend/src/services/record-job-run.js` | The plan tree lists it. T3.1.6 says “call `record-job-run`” and does not say to add the file | T3.1.6 |
| Compose database settings | `POSTGRES_PASSWORD` and the concrete `DATABASE_URL` | T1.2 |
| Sample JSON schema | One object shape for `backend/sample/sprint.json` and the fixtures | T3.1.4 |
| Overloaded display field names | T3.2.4 requires them and does not name them | T3.2.4, and the spec API table if they are part of the contract |
| Per-fixture `asOfDate` | Band fixtures are not stable without it | T3.2.5 |

The plan tree otherwise matches the tasks: route files, the six service modules besides `record-job-run.js`, `jira-client.js`, the migration, the query module, `migrate.js`, `config.js`, and `sprint-health-api.js`.

## Traceability

| Success criterion | Tasks that can demonstrate it | Hole |
| --- | --- | --- |
| SC-001 | T4.2, T4.4 | README URL is T1.6 |
| SC-002 | T3.1.3, fixtures in T3.2.5 | Fixture dates are not fixed |
| SC-003 | T3.2.1 through T3.2.5 | Keyless link is a rule, not a named fixture |
| SC-004 | T3.2.4 | Covered |
| SC-005 | T3.1.3, T3.2.3, T3.2.5 | Non-numeric display is thinner than null display |
| SC-006 | T3.3.1 through T3.3.3 | Covered |
| SC-007 | T3.4.2, T3.4.3 | Stubbed only. T4.4 does not open a live board |
| SC-008 | T4.3 | Not on the M4 dependency edge |
| SC-009 | T4.1 | Depends on feature tests the table lists and the tasks skip |
| SC-010 | T4.4 | Sample page only |

## Suggested closures before implementation

1. Amend `spec/specification.md` so the rows in “Specification text the plan reversed” match the plan, or state in that file that `spec/plan.md` wins for those ids.
2. Pick the directory mount for `./data` and delete the file-bind sentence in the plan.
3. Define the source-error suffix as ` HTTP ` plus the digits of `httpStatus`, and keep the 404 case as the test, or keep the task’s 404-only sentence and change the plan.
4. Name the `job_runs` columns each insert writes, including error rows, in T3.1.6 and T3.4.3.
5. Name overloaded display fields, or say the backend sends decimal strings and the screen prints them unchanged.
6. Add `POSTGRES_PASSWORD`, the database name, and the `DATABASE_URL` to T1.2. Move “listening backend” to T1.5, or allow a one-line listener in T1.2.
7. Make T3.2.1 depend on T3.1.6 and T3.1.7, and make T4.4 depend on T4.3, so M3.1 and M4 mean the feature and the release checks are finished.
