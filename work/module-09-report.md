# Module 09 Completion Report

## Tracked Files
.gitignore
PROJECT_IDEAS.md
README.md
backlog.md
calculator.py
hello.txt
main.py
project_spec.md

## Backlog Commit History


## backlog.md Contents
# Sprint Health Dashboard — Implementation Backlog

Work order only. Every task below is in this version. A phase is not a place to stop.

Build Core Features in this order: sprint model and health rules, then the page, then the goal-status save. Write each Testing task with the feature it locks. Integration is the live Jira path only. Sample JSON, Flask routes, and the goal-status file stay in Core Features.

The contract is `project_spec.md`. Where a task and that file disagree, the spec wins until the spec is edited.

## Setup

- [ ] Confirm Python 3.11 or newer, create a virtualenv, and install the pinned packages in `requirements.txt` (Flask, Jinja2, requests, python-dotenv, pytest).
- [ ] Replace the calculator app: add `app.py` as the only start command (`python app.py` from the repo root) and remove `calculator.py` and `main.py` from the project.
- [ ] Lay out the dashboard package: `app.py`, Jinja templates, one plain CSS file, `data/` for sample JSON, and a `tests/` package. No frontend framework and no client-side router.
- [ ] Load config with `python-dotenv` when a local `.env` exists. Variables already set on the machine win. Default `DATA_SOURCE` to `sample` when it is unset. Exit on startup with a clear error if `DATA_SOURCE` is anything other than `sample` or `live`.
- [ ] Bind the process to localhost only. Print the local URL on start. Do not enable a debug console that prints request headers, and do not turn on directory listing.
- [ ] Fail startup with a clear file error if the template or the default sample JSON is missing. Do not serve a blank 200.
- [ ] Confirm `.gitignore` keeps `.env`, `.env.*`, `data/goal_status.json`, and virtualenv directories out of git. Do not commit tokens, emails, or internal URLs.

## Core Features

### Sprint model and health rules

- [ ] Define one sprint model used by both modes: sprint name, goal text, start date, end date, and issues. Each issue has key, summary, type, status name, status category, story points or null, assignee or null, due date or null, a flagged bit, and blocker links.
- [ ] Map sample JSON into that model before any status or list runs. Templates and list rules must not read raw sample JSON. Use ISO dates and null for a missing assignee, points, or due date.
- [ ] Drop issues before point sums and list rules. Count only type names Story, Bug, and Task, case-insensitive. Exclude Sub-task, Subtask, any other type (including Epic and a type named User Story), and any issue that has a parent and is not Story, Bug, or Task. Do not walk children to discover extra points.
- [ ] Treat an issue as done only when status category is Done. Trust the category, not the status name and not the resolution field.
- [ ] Normalize story points: null, missing, non-numeric, and negative values count as zero; a stored zero stays zero; fractional points such as 0.5 sum as numbers and are not rounded before the total.
- [ ] Compute committed points as the sum of normalized points on counted issues, and done points as that sum on issues whose category is Done. When committed points are zero, completed percent is 100.
- [ ] Compute elapsed percent from calendar dates on the server’s local “today”: day count is end minus start; portion passed is today minus start, divided by that day count, times 100. Elapsed is 0 before the start date and 100 on or after the end date. If start and end are the same day, elapsed is 100 on or after that day and 0 before it.
- [ ] If sprint start or end is missing, skip both percents and record that dates are unavailable. Do not treat missing dates as zero elapsed.
- [ ] Set `gap = elapsed percent − completed percent` and apply the band to the unrounded gap: On track when gap is 0 or negative, At risk when gap is greater than 0 and at most 15, Off track when gap is greater than 15.
- [ ] Build the Blocked list from counted, not-done issues that match any of: flagged impediment, status name Blocked (case-insensitive), or an inward “is blocked by” link. An outward “blocks” link alone does not qualify. One issue, one row. Name every matching signal in the order flag, status, then link (`Flagged`, `Status: Blocked`, `Blocked by` plus linked keys when present). A missing flag or missing links makes only that signal false. A blocker outside the sprint still counts and is not imported as its own row.
- [ ] Build the Overdue list from counted, not-done issues whose due date is before today. A due date of today is not overdue. Missing, empty, and unparseable due dates stay off the list. Do not copy the sprint end date or a subtask due date onto a parent. Compare calendar dates and ignore time of day. Show the due date as `YYYY-MM-DD`.
- [ ] Build the Unassigned list from counted, not-done issues with no assignee. No assignee means null, missing, or no account id and no display name. A real account whose display name is “Unassigned” stays assigned. A deactivated account stays assigned.
- [ ] Build the Overloaded list of people, not issues. Open points are normalized points on counted, not-done issues. Assignees with open points greater than zero form the median set (middle value, or the average of the two middle values). A person is listed only when open points are strictly greater than 1.5 times that median and at least 5. One person with all the open work yields an empty list. Unassigned open issues do not create a person. Omit anyone who fails either threshold.
- [ ] Sort Blocked, Overdue, and Unassigned by issue key ascending. Sort Overloaded by open points descending, then by display name. The same input must yield the same order.
- [ ] Add committed sample JSON that is safe to commit and covers: equal completed and elapsed (On track), 15 points behind (At risk), more than 15 behind (Off track), flag-only, status-only, link-only, and flag-plus-link blocked issues, one overdue issue, one not-done unassigned story and one done unassigned story, one open issue with null points, one issue with no due date, one subtask under a counted story, one overloaded person, one even-load case where Overloaded is empty, one issue on two lists, a non-empty sprint goal, and a second fixture whose goal text is null or whitespace.
- [ ] Load that sample file when `DATA_SOURCE` is `sample`. Do not call the network and do not read Jira variables on that path, even if they are set.

### Page

- [ ] Render one server-side HTML page, stacked in one column, in this order: sprint name and dates (including the server’s today as `YYYY-MM-DD`), points-versus-time status, sprint goal and its status control, then Blocked, Overdue, Unassigned, and Overloaded.
- [ ] Show the points signal as text On track, At risk, or Off track, plus both percents and the signed gap to one decimal place. When dates are missing, say they are unavailable and do not invent a percent. Color may reinforce the label; the label text is required.
- [ ] Show the sprint goal in full, escaped, with no truncation and no raw HTML. When the goal is missing or only whitespace, say the goal is not set and still show the status control. Keep the goal status independent of the points label. Do not collapse the two signals into one score or an “All good” line.
- [ ] Render each issue list with a heading, a count of rendered rows, and columns for key, summary, assignee or “Unassigned”, and story points. Missing points display as an em dash. A blocked row also names the matched signals. An overdue row shows the due date. An overloaded row shows the person, open points, the median, and the 1.5 times threshold, with median and threshold rounded to one decimal for display only.
- [ ] Keep empty lists in place. A count of zero still shows the heading and the sentence “Nothing needs attention.”
- [ ] In sample mode, issue keys and the sprint name are plain text, not links.
- [ ] Escape issue summaries and any other text taken from the data source.
- [ ] Recompute lists from the current source on every refresh. Do not keep a stale in-memory sprint.
- [ ] Style the page with plain CSS so the summary is readable before the lists on a 1280-pixel-wide window, and so a narrow window still shows health first in document order. Status words appear as text in the HTML, not only as CSS class names.
- [ ] Add no filter, search, issue-detail page, or other control. The goal-status form is the only form, and it must save without JavaScript.

### Goal-status save

- [ ] Store one local file, `data/goal_status.json`, with a single field `status` whose value is `on_track`, `at_risk`, or `off_track`. Sample mode and live mode share this file. Do not key it by sprint id.
- [ ] On load, if the file is missing, empty, unreadable, or holds any other value, show On track and do not overwrite the bad file until the manager submits a valid status.
- [ ] Render the control as a fieldset of three always-visible choices labeled On track, At risk, and Off track. Exactly one is selected. Reject any other posted value: leave the file unchanged and show an error.
- [ ] On a valid post, create the parent `data/` directory if needed, write the JSON to a temporary file, flush it, and replace `data/goal_status.json`. Then render the page with that status selected. Saving the same value again rewrites the file and is not an error.
- [ ] If the write fails, show the previous status and a save error. Do not claim the new choice was stored.
- [ ] Changing `DATA_SOURCE` does not clear the file. A Jira failure must not change the saved status either.

## Integration

Live mode only. The health rules, page, and the goal-status file already exist and must not grow a second set of rules for Jira.

- [ ] When `DATA_SOURCE=live`, require `JIRA_SITE_URL`, `JIRA_BOARD_ID`, `JIRA_EMAIL`, and `JIRA_API_TOKEN` before any HTTP call. If one is missing, name the variable on the page and do not include its value. Expect an HTTPS site URL with no trailing path beyond the host. Do not disable certificate checks.
- [ ] Call Jira Cloud with basic auth (`JIRA_EMAIL` and `JIRA_API_TOKEN`) using GET only. Use the Agile API to read the board’s active sprint, then the issue search API for that sprint’s issues. Request summary, issue type, status, assignee, due date, story points, flag, and issue links. Do not request comments or attachments. Page the search internally until the sprint’s issues are loaded, then discard anything that is not in that sprint.
- [ ] Map the live payload into the same sprint model the sample path uses, then run the existing health rules. If the site uses a differently named story-point field, do not add a mapping in this version.
- [ ] If the board has no active sprint, show a clear message and no issue lists. Do not fall back to sample data or to the last closed sprint.
- [ ] If the board reports more than one active sprint, show an error and do not pick one.
- [ ] If Jira returns an HTTP error or a JSON shape the mapper cannot read, show the error in the summary region (variable names and status codes only, never the token or email) and render no fabricated issue rows. Leave the saved goal status unchanged. Keep the goal-status control on the page.
- [ ] In live mode, link each issue key to that issue on `JIRA_SITE_URL` so it opens in a new tab. A sprint-name link to the sprint in Jira is optional and not required for the success criteria.
- [ ] Confirm the token and email never appear in the page, the repo, application logs, or `data/goal_status.json`. Normal request logs may include issue keys and must not include env values or issue descriptions.
- [ ] There is no page toggle for the data source. Switching modes means a new process start, or a reload that re-reads the environment.

## Testing

Write these with the matching Core Features and Integration tasks. They run with `pytest`, use fixtures, and do not start a browser or open a socket. A reviewer does not need a Jira site.

- [ ] Lock the three points bands on exact gaps: equal percents are On track, a gap of 15 is At risk, a gap greater than 15 is Off track. Assert the band uses the unrounded gap so display rounding cannot move a 15.0 case into Off track.
- [ ] Lock elapsed-percent edges: before the start date, on or after the end date, and a sprint whose start and end are the same day. Lock completed percent of 100 when committed points are zero. Lock the missing-dates path so no percent is invented.
- [ ] Lock point normalization: null, missing, non-numeric, and negative points add zero; zero stays zero; fractional points sum without rounding first; a done issue with no points cannot create a commitment by itself.
- [ ] Lock subtask exclusion: the sample subtask key is absent from every list and from point totals, and the parent’s points appear once.
- [ ] Lock Blocked: flag-only, status-only, link-only, and flag-plus-link (one row, both signals, flag before link). An outward “blocks” link alone is absent. A done flagged issue is absent. Status match is case-insensitive and other status names do not count.
- [ ] Lock Overdue: a due date before today is listed as `YYYY-MM-DD`; today, a future date, a missing or unparseable date, and a past due date on a done issue are absent. The sprint end date alone does not add a row. A parent with no due date stays off the list when only a subtask is overdue.
- [ ] Lock Unassigned: the not-done story with a null assignee is listed with the word Unassigned and an em dash when points are null; the done story with a null assignee is absent. An account with display name “Unassigned” is not listed.
- [ ] Lock Overloaded: the overloaded person is listed; the even-load fixture is empty; open points equal to 1.5 times the median are omitted; open points of 4.9 are omitted even when they beat the median test; a single person with all open work yields an empty list; unassigned open issues do not create a person. Median and threshold display rounds to one decimal; the comparison uses exact values.
- [ ] Lock list membership across rules: one issue that matches two lists appears on both, once on each. Excluded types never appear. Sort order is key ascending for issue lists and open points descending, then name, for Overloaded.
- [ ] Lock the goal-status round trip on a temporary file: missing, empty, and invalid files start at on track and are not overwritten until a valid save; a valid post writes `on_track`, `at_risk`, or `off_track` and a second save of the same value rewrites the file; an unknown form value leaves the file unchanged; a failed write does not leave partial JSON that the next load treats as valid.
- [ ] Lock sample mode startup and rendering with the Flask test client: the sample sprint’s status words and the four headings are in the HTML as text; empty lists still show “Nothing needs attention.”; a missing goal fixture says the goal is not set and still accepts a status save.
- [ ] Lock live-mode failures without the network, using a fake HTTP layer: a missing required variable names that variable and does not call Jira; no active sprint shows the empty-sprint message and does not load sample issues; more than one active sprint is an error; an HTTP or mapper error renders no issue rows and leaves the goal-status file unchanged. Assert sample-mode tests fail if a socket is opened.
- [ ] Add one manual browser check to the delivery notes: start sample mode, open the printed URL, and confirm the summary and the four headings render. Automated tests do not start a browser.

## Documentation

The README restates the health rules and stays aligned with `project_spec.md`. It also points at that spec. It does not describe the calculator.

- [ ] Document the install and start path: create a virtualenv, install `requirements.txt`, run `python app.py`, open the printed localhost URL. State that the default run needs no `.env` and no Jira credentials.
- [ ] Document live mode as optional environment variables: `DATA_SOURCE`, `JIRA_SITE_URL`, `JIRA_BOARD_ID`, `JIRA_EMAIL`, and `JIRA_API_TOKEN`. State that the token is read-only permission to browse one Jira Cloud board, that Jira Server and Data Center are out of scope, and that the token value must not be committed.
- [ ] Document `data/goal_status.json`: path, the single `status` field, and the three allowed values `on_track`, `at_risk`, and `off_track`. Note that the file is created on the first successful save, is gitignored, and is shared by sample and live mode.
- [ ] Restate the points-versus-time rule: committed points on Story, Bug, and Task; done means status category Done; missing points count as zero; completed percent is 100 when committed points are zero; elapsed percent uses calendar days; gap is elapsed minus completed; On track, At risk (gap greater than 0 and at most 15), and Off track (gap greater than 15) use the unrounded gap.
- [ ] Restate the sprint-goal rule: goal text comes from the data source and is not written back; a missing goal says the goal is not set; the manager’s status is a separate local judgment and does not follow the points gap.
- [ ] Restate the four lists: Blocked (flag, status name Blocked, or inward “is blocked by”); Overdue (due date before today only); Unassigned (no assignee); Overloaded (open points strictly above 1.5 times the median and at least 5). Note that subtasks are excluded, the same issue may appear on more than one list, empty lists stay visible, and the page does not change Jira.
- [ ] Point to `project_spec.md` for the full contract, including non-goals: one board and one active sprint, no past sprints, no board switcher, no writes to Jira, no combined health score.
