# Sprint Health Dashboard

Requirements for the first version. The dashboard shows one team’s active sprint as a health snapshot: whether the sprint is on track, then the items a manager needs to act on.

This spec is the contract for that page. It names the user, the stack, the success checks, the rules, the limits, and the work this version will not do.

Read Purpose and Users and scope to see who the page is for. Read Tech Stack for the process and the libraries. Read Success Criteria for the checks a build must pass.

Detailed Requirements holds the rules: points versus time, the sprint goal, and the four lists. Constraints holds the technical, time, and resource limits. Non-Goals lists the nearby ideas that stay out.

Sample mode is part of the contract. The page must be demonstrable with the built-in sprint and no API token.

Live mode is the same page pointed at one Jira Cloud board. It is optional for a demo and required as a path in the build.

The goal status is the only value the manager writes. It lives in a local file, not in Jira.

Issue rules are exact on purpose. A missing due date is not overdue. A subtask does not add points. A person is overloaded only when both thresholds are met.

Where this file and a later comment disagree, this file wins until it is edited.

The intro above is the product in one sentence. The sections below make that sentence testable.

Statuses use the words On track, At risk, and Off track. The same words are used for the points signal and for the goal judgment, and they are still two fields.

Lists stay short. Headings remain when the count is zero so a manager can see that the check ran.

Dates are calendar dates. Percents shown on the page use one decimal place. The band uses the exact gap.

The app is local. It binds to localhost and does not ship as a hosted service in this version.

Tests lock the rules with sample fixtures. A reviewer should not need a Jira site to confirm the bands and the lists.

## Purpose

The dashboard gives a manager one page for the active sprint. The visit answers health first, then lists only the work that needs a decision.

A manager opens one page and, in a short look, learns two things:

1. Whether the sprint is on track to finish what the team committed to.
2. Which blocked, overdue, unassigned, or overloaded work needs a decision.

On track is two signals at the top of the page. The first compares completed story points with the share of sprint time that has passed. The second shows the sprint goal text and a status the manager sets. The two signals stay visible together so a numeric gap and a goal judgment can disagree without one overwriting the other.

Needs attention is four lists under that summary: blocked, overdue, unassigned, and overloaded. A list includes only rows that match its rule. An empty list means nothing in that category needs a decision. The same issue may appear in more than one issue list when it matches more than one rule.

The page is a snapshot, not a second backlog. It does not ask the manager to scan every sprint issue. Done work stays in the point totals and stays off the attention lists. Subtasks stay out of both, so parent points are not counted twice.

The manager uses the page to decide what to unblock, reassign, or rebalance before the sprint ends. The page does not make those changes in Jira. The only value it stores is the manager’s goal-status judgment, in a file next to the app.

A manager who already sees a healthy sprint can stop after the summary. A manager who sees risk can move straight to the list that explains it. Either reading should be possible without opening Jira first. Sample mode exists so that reading works with no credentials.

- The points signal uses committed story points and sprint dates, not a ticket count and not a gut feel.
- The goal signal stays a human judgment because Jira does not store whether the goal is on track.
- Blocked work is listed from a flag, a Blocked status, or an “is blocked by” link.
- Overdue work uses the issue due date only. A sprint that ends soon does not, by itself, mark issues overdue.
- Unassigned work is any counted issue that is not done and has no assignee.
- Overloaded work is a person whose open points are at least 5 and more than 1.5 times the median.

## Users and scope

- **User.** A manager of one team. This person reads the snapshot and sets the sprint-goal status.
- The manager is the only role. There is no separate view for a team member, a stakeholder, or an executive rollup.
- The team is whoever is assigned to issues in the active sprint. The app has no separate team roster.
- **Scope.** One team and its active sprint. Live mode reads that sprint from one Jira board.
- An active sprint is the sprint Jira marks active on that board. Issues outside the sprint are ignored.
- If the board has no active sprint, the page says so and shows no issue lists. It does not substitute the last closed sprint.
- If the board reports more than one active sprint, the page shows an error and does not pick one. This version expects a single active sprint.
- A board switcher and a multi-team page are later versions. This version has no control for choosing another board.
- Sample mode serves the same user and the same scope. Built-in data stands in for the board so the page runs with no Jira account.
- The manager acts on the lists outside the tool: in Jira, a standup, or a one-on-one. The dashboard’s only write is the local goal status.
- One person uses the app on one machine. Two managers do not share a session or a goal-status file.
- The page does not include Confluence notes, release checklists, or past sprints. Those stay outside this version.
- Sprint membership, story points, assignees, due dates, flags, and blocker links are read from the data source. The manager does not edit them here.
- The scope ends at “what needs a decision.” Carrying out the decision in Jira is out of scope.
- Labels and empty-state sentences are English. This version does not localize the page.

## Tech Stack

- **Language.** Python 3.11 or newer. The app is a single local process started from this repo.
- **Server.** Flask serves one HTML page and one form post that saves the sprint-goal status.
- **Page.** Jinja2 templates render HTML. Layout and status colors are plain CSS. No frontend framework and no client-side router.
- **HTTP client.** `requests` calls the Jira Cloud REST API in live mode only. Sample mode does not import a network call into the request path.
- **Config.** `python-dotenv` loads a local `.env` when that file exists. Environment variables already set on the machine win.
- **Sample data.** A JSON file in the repo with the same shape as a Jira sprint: sprint name, goal, start, end, and issues.
- **Goal status.** A JSON file next to the app, for example `data/goal_status.json`. Git ignores that file and `.env`.
- **Tests.** `pytest` covers the status math, the four list rules, and the goal-status file round trip. Tests use sample data, not a live Jira site.
- `DATA_SOURCE` — `sample` (default) or `live`. Any other value is an error on startup.
- `JIRA_SITE_URL` — site base URL, with no trailing path beyond the host, such as `https://example.atlassian.net`.
- `JIRA_BOARD_ID` — one numeric board id.
- `JIRA_EMAIL` — Atlassian account email. Jira Cloud basic auth sends this with the token.
- `JIRA_API_TOKEN` — API token. It is read from the environment and never written into source, logs, sample JSON, or HTML.
- Live mode uses the Agile API to find the board’s active sprint, then the issue search API for that sprint’s issues, including story points, assignee, status category, due date, flag, and issue links.
- Start command is `python app.py` from the repo root, then open the printed local URL in a browser. Dependencies are pinned in `requirements.txt`.
- The process binds to localhost only. This version is not packaged for a shared host, a container cluster, or a public URL.

## Success Criteria

A build meets this version when all of the following are true.

1. With no Jira credentials, starting the app and opening it in a browser shows the sample sprint: points-versus-time status, sprint goal text, goal status, and the four attention lists.
2. Points-versus-time status uses `gap = elapsed percent − completed percent`. On track when `gap` is 0 or negative. At risk when `gap` is greater than 0 and at most 15. Off track when `gap` is greater than 15.
3. The sample sprint includes a fixture where completed percent equals elapsed percent, and that case is labeled On track.
4. The sample sprint includes a fixture 15 percentage points behind, labeled At risk, and a fixture more than 15 behind, labeled Off track.
5. Blocked, overdue, unassigned, and overloaded lists match the rules in Detailed Requirements on the sample sprint.
6. An issue with no due date is absent from Overdue. The sprint end date alone does not put an issue on Overdue.
7. A subtask is absent from every list and from point totals. Its parent’s points are counted once.
8. A blocked issue appears once on Blocked, and the row names every signal that matched. An issue that matches two lists appears on both.
9. Overloaded is empty when no person meets both thresholds. A person with 5 or more open points is still omitted when those points are not above 1.5 times the median.
10. An issue with no story points adds zero to the commitment and to open points, and it still appears on a list when it matches that list’s rule.
11. When the sprint goal text is missing, the page says the goal is not set, and the status control still saves a value.
12. After the manager sets the sprint-goal status, a browser refresh and a process restart both show that same status. A missing or unreadable status file starts the control at on track.
13. With `DATA_SOURCE=live` and the Jira variables set, the same page shows the active sprint of that one board. Labels and lists follow the same rules. Only the source of the numbers changes.
14. Live mode with no active sprint shows a clear message and does not fall back to sample data. A Jira error leaves the saved goal status unchanged.
15. The API token is not visible in the page, the repo, application logs, or the goal-status file.
16. Automated tests for the status bands, the four list rules, subtask exclusion, and the goal-status round trip pass without network access.

## Detailed Requirements

This section is the behavior the page must implement. Functional requirements describe what the manager sees and which issues qualify. Non-functional requirements describe how the local app starts, fails, and stores the one writable value.

Both data modes feed the same rules. Sample JSON and live Jira responses are mapped into one sprint model before any status or list is computed. The page never branches the health rules on the source.

The model needs a sprint name, goal text, start date, end date, and a list of issues. Each issue needs a key, summary, type, status name, status category, story points or null, assignee or null, due date or null, a flagged bit, and blocker links.

Story points versus time uses the sprint dates and the issue points. The four lists use the issue fields. The goal status does not come from that model. It comes from the local file.

Dates are calendar dates. Percents are rounded to one decimal place for display. The band decision uses the unrounded gap, so rounding cannot move a 15.0 case into Off track.

Empty lists still render their headings and an empty state sentence. A missing sprint does not render fake rows. A failed save does not claim the new goal status was stored.

The rest of this section states the rules those checks implement. Where a rule and an example disagree, the rule wins.

- Functional requirements cover the two signals, the four lists, which issues count, done and estimates, data sources, and delivery.
- Non-functional requirements cover offline sample mode, read-only Jira access, secret handling, and the local process.
- A rule that names “the page” applies in both data modes unless it says sample or live.
- Counts in headings include only rows that the list actually renders.
- Sorting is part of the requirement. Same input must yield the same row order.
- Display names for people come from the assignee field. The app does not build names from email local-parts.
- Sprint name and sprint dates appear in the summary so the snapshot can be checked against Jira.
- An error state replaces issue rows. It does not mix sample issues into a failed live load.

### Functional

The manager can do two things: open the page, and set the sprint-goal status. Everything else is read from sample data or from Jira.

Opening the page always shows the same regions, in this order: sprint name and dates, points-versus-time status, sprint goal and its status control, then Blocked, Overdue, Unassigned, and Overloaded.

The points-versus-time label is one of On track, At risk, or Off track. The goal status is a separate control with the same three words. The page does not combine them into a single score.

Issue lists show key, summary, assignee or “Unassigned”, and story points. Points that are missing display as an em dash and count as zero. Overloaded rows show a person and open points instead of an issue key.

Done issues remain in the commitment totals. They are excluded from Blocked, Overdue, and Unassigned, and their points are not open. Subtasks are excluded before those rules run.

The only successful write is the goal status. After a successful post, the browser shows the page again with that status selected. After a failed post, the page shows the previous status and an error.

Sample mode and live mode use this same interaction. Live mode adds an error region when Jira cannot be read. That error does not remove the goal-status control.

No other control edits sprint data. There is no filter bar, no search box, and no issue detail page in this version.

- Refreshing the browser recomputes lists from the current source. It does not keep a stale in-memory sprint.
- The goal-status post is the only form. It sends one of the three allowed values.
- Unknown form values are rejected. The file is left unchanged and the page shows an error.
- The sprint name is plain text from the source. It is not a link to the board in sample mode.
- In live mode the sprint name may link to that sprint in Jira. The link is optional and is not required for the success criteria.
- Keyboard use is the browser’s default for a form and for links. No custom keyboard scheme is required.
- The page has one main column. Regions are stacked in the order listed above.
- Empty attention lists still occupy their place in that order. They are not removed from the layout.

#### On track

The top of the page has two signals. They sit above the attention lists so the health answer is visible before any exception.

The first signal is story points versus time. It answers whether completed work is keeping up with the calendar. The second signal is the sprint goal. It answers whether the manager judges the goal itself on track.

Each signal has a short label and the three-way status. The points signal also shows the two percents that produced the label: completed and elapsed. The goal signal shows the goal text beside its control.

The signals do not hide each other. An Off track points label stays on screen when the goal status is On track, and the reverse is also shown as-is.

“Today” for both signals is the server’s current date in the server’s local calendar. The page prints that date next to the sprint dates so the elapsed percent can be checked by hand.

If the sprint dates are missing, the points signal says the dates are unavailable and does not invent a percent. The goal signal still renders.

The sections below define the arithmetic and the goal control. The summary region only displays the results of those rules.

- Both signals use the words On track, At risk, and Off track. The words match. The fields stay independent.
- The points signal cannot be edited. The goal status can.
- If dates are missing, say so in the points signal and skip the percent. Do not treat missing dates as zero elapsed.
- If the goal text is missing, say the goal is not set. Do not hide the status control.
- The summary does not list issue keys. Keys belong in the attention lists.
- A healthy sprint still shows both signals. It does not collapse the summary into a single “All good” line.
- The gap is shown as percentage points, with a sign so “ahead” and “behind” are obvious.
- Color may reinforce the label. The label text is required even when color is present.

##### Story points versus time

Compare the percent of committed story points that are done with the percent of sprint days that have passed.

| Status | Rule |
| --- | --- |
| On track | Completed percent is at or ahead of the elapsed-time percent |
| At risk | Completed percent is behind by up to 15 percentage points |
| Off track | Completed percent is behind by more than 15 percentage points |

Calculations:

- Committed points are the sum of story points on stories, bugs, and tasks in the sprint. An issue with no story points adds zero. Subtasks are not in the sum.
- Done points are the committed points on issues whose status category is Done.
- Completed percent is done points divided by committed points, times 100. When committed points are zero, completed percent is 100, so the status is On track.
- Elapsed percent uses calendar days from the sprint start date to the sprint end date. Day count is the end date minus the start date. The portion passed is today minus the start date, divided by that day count, times 100.
- Elapsed percent is 0 before the start date and 100 on or after the end date. If the start and end dates are the same day, elapsed percent is 100 on or after that day and 0 before it.
- Gap is elapsed percent minus completed percent. On track when gap is 0 or negative. At risk when gap is greater than 0 and at most 15. Off track when gap is greater than 15.
- Display both percents to one decimal place. Apply the band to the exact gap, before that rounding.
- The row shows the label, both percents, and the gap in percentage points so a manager can see a 14.9 At risk case and a 15.1 Off track case.
- Issues added or removed from the sprint change the commitment on the next load. This version does not freeze the original commitment.

##### Sprint goal

The second signal is the sprint goal. It shows the goal text and a status the manager sets. The text and the status are different fields. Only the status is writable on this page.

- The goal text comes from Jira’s sprint goal. In sample mode it comes from the sample file. The dashboard does not edit that text and does not write it back to Jira.
- When the sprint has no goal text, or the text is only whitespace, the page says the goal is not set. The status control still works.
- The manager sets a separate goal status on the dashboard: on track, at risk, or off track. Exactly one value is selected. The control is a fieldset of three choices, not a free-text box.
- That status is a judgment. Jira does not supply it. It does not change the points-versus-time status, and the points-versus-time status does not change it.
- The page loads the saved status from the local JSON file. The file stores one field, `status`, whose value is `on_track`, `at_risk`, or `off_track`.
- If no status has been saved, or the file is missing, empty, or contains another value, the control starts at on track. The page does not overwrite a bad file until the manager chooses a status.
- Choosing a status saves it immediately. The handler writes the file, then renders the page. A refresh and a restart both show the saved value.
- If the write fails, the page keeps the previous status and shows a save error. It does not pretend the new choice was stored.
- Sample mode and live mode share this one saved status. This version has a single active sprint on the page, so the file does not key the status by sprint id.
- Changing data source does not clear the file. The manager can set the status again when the underlying sprint changes.
- The goal block prints the goal text in full. It does not truncate the sentence, and it does not render raw HTML from the goal.
- The three choices are always all visible. The control does not hide the unselected ones.
- The saved word on screen is On track, At risk, or Off track, matching the points signal’s labels.
- A second save of the same value still rewrites the file and still shows that value. It is not an error.

#### Needs attention

Four lists sit under the on-track summary. The order is Blocked, Overdue, Unassigned, then Overloaded. Each list stays short because it includes only matches.

Each issue row shows the key, summary, assignee (or none), and story points. A blocked row also shows which signal matched. Overloaded rows are people, not issues.

The same issue may appear on more than one issue list when it matches more than one rule. It still appears once inside each list. Done issues are removed before these rules run. Subtasks are removed before these rules run.

Each list has a count in the heading. A count of zero is shown, with the sentence “Nothing needs attention.” The heading is not hidden.

Sort issue lists by key, ascending, so the same data produces the same order on reload. Sort the overloaded list by open points descending, then by name.

The list explains why the row is present. Blocked names the signal. Overdue shows the due date. Unassigned has no assignee. Overloaded shows open points, the median, and the 1.5 times threshold used for that page load.

Rows are text. The issue key may be plain text in sample mode. In live mode the key links to the issue on the configured Jira site. The link is the only Jira navigation this page offers.

A person with open work who is not over the threshold is omitted from Overloaded. They are not listed as healthy. The list is only the exceptions.

- List headings use the names Blocked, Overdue, Unassigned, and Overloaded.
- The count is the number of rows under that heading, not the number of raw Jira issues before filtering.
- “Nothing needs attention.” is the empty sentence for every list, including Overloaded.
- Rows do not include a description field, comments, or labels. The summary is enough to recognize the issue.
- Live links open the Jira issue in a new tab. Sample keys stay text.
- Reloading does not change membership unless the source data or the date has changed.
- The four lists do not share a “dismiss” action. A row leaves only when the underlying rule stops matching.

##### Blocked

An issue is blocked when any of these is true, and the issue is not done:

- It is flagged in Jira (Flagged = Impediment).
- Its status name is Blocked. The match is case-insensitive. Other status names are not treated as blocked.
- It has an “is blocked by” link to another issue. The link type’s inward description is “is blocked by”. A “blocks” outward link, by itself, does not put this issue on the list.

One issue appears once. The row shows which signal matched. When more than one signal matches, the row lists each of them, in the order flag, status, then link.

A done issue is omitted even if the flag or the link is still present. A subtask is omitted even if it is flagged. The parent is judged on its own fields.

The link signal does not require the blocking issue to be inside this sprint. A blocker outside the sprint still counts. The row does not import that outside issue as its own line.

If the flagged field is missing from the payload, the flag signal is false. If links are missing, the link signal is false. The status signal still applies.

Sample data sets these three signals explicitly so each one can be true alone and so one issue can carry two of them.

The blocked list does not include issues that are merely high priority, in progress, or waiting on a code review. Those states need one of the three signals.

- Flag text on the row is “Flagged”. Status text is “Status: Blocked”. Link text is “Blocked by” plus the linked issue keys when those keys are present.
- Linked keys that are missing from the payload still count as the link signal. The row then says “Blocked by” without a key.
- Priority, labels, and components do not add a fourth signal.
- An issue blocked only by an outward “blocks” link is not listed.
- Sample fixtures cover flag-only, status-only, link-only, and flag-plus-link. The last of those is one row with both signals.

##### Overdue

An issue is overdue when its due date is before today and it is not done. An issue with no due date is not overdue. The sprint end date feeds the on-track signal and does not, by itself, mark issues overdue.

- Compare dates, not timestamps. A due date of today is not overdue. A due date of yesterday is overdue.
- “Today” is the server’s current calendar date, the same date used for elapsed time.
- A done issue with a past due date is omitted. Done means status category Done, not a particular status name.
- A missing due date, an empty string, and an unparseable due date are all “no due date”. They stay off this list. The row is not shown as an error in this list.
- The sprint end date is not copied onto issues that lack a due date.
- An issue that is also blocked or unassigned still appears here when the due date rule matches. The other lists keep their own rows.
- The row shows the due date so the manager can see how late it is. It does not show a day count that treats the sprint end as the deadline.
- Subtasks with due dates are ignored. If the parent has its own past due date and is not done, the parent is listed once.
- Future due dates are not listed, including due dates after the sprint end. Being unfinished near the sprint end is the points-versus-time signal, not this list.
- The due date is shown as `YYYY-MM-DD`.
- Time-of-day on a Jira date-time is ignored. The calendar date is the whole comparison.
- Issues due today stay off the list even if the sprint ends today.
- A parent with no due date stays off the list even when a subtask is overdue. The subtask is not counted, and its date is not copied up.
- The overdue list does not sort by how late the issue is. It sorts by issue key, like the other issue lists.

##### Unassigned

An issue is unassigned when it has no assignee and it is not done.

- No assignee means the assignee field is null, missing, or has no account id and no display name.
- A display name of “Unassigned” supplied as a real account is still an assignee. Only the absence of an account counts.
- Done issues with no assignee are omitted. Their points remain in the commitment if they are stories, bugs, or tasks.
- Subtasks with no assignee are omitted. They do not create a row and they do not add points.
- The row shows “Unassigned” in the assignee column and still shows the key, summary, and story points.
- An unassigned issue with no story points still appears. Points display as an em dash and count as zero.
- An unassigned issue can also be blocked or overdue. It is then on each matching list, once per list.
- Assignee is read from the issue, not inferred from a commit, a comment, or a sprint role.
- Sample data includes one not-done story with a null assignee and one done story with a null assignee. Only the first appears here.
- The column header is Assignee. The empty value is the word Unassigned.
- An issue assigned to a deactivated account is still assigned. It is not moved here.
- Unassigned issues with a future due date appear here and not on Overdue.
- Unassigned done issues never appear here, even when they were unassigned at the end of the work.
- This list does not propose an assignee. It only shows that nobody is set.

##### Overloaded

A person is overloaded when both are true:

- Their open story points are more than 1.5 times the median open points among people who still have work.
- They have at least 5 story points open.

Open points are story points on issues that are not done. Unestimated open issues add zero. Subtasks are not included. People who still have work are assignees whose open points are greater than zero.

The median uses those open-point totals, one number per person. With an odd count, the median is the middle value after sorting. With an even count, the median is the average of the two middle values. When only one person has open work, the median is that person’s total, so the 1.5 times test fails and the list is empty.

When the team’s load is even, this list is empty. Even means no person is strictly above 1.5 times the median. The list is people, not issues. Each row names the person, their open points, the median, and the threshold.

- The comparison is strict. Open points equal to 1.5 times the median are not enough. Open points of 4.9 are not enough, even if they exceed the median test, because of the 5 point floor.
- Unassigned open issues do not create an “Unassigned” person on this list. They belong to Unassigned.
- A person whose issues are all done has zero open points and is not part of the median.
- Two assignees are two people even when their open points match. Ties stay as separate rows.
- Names sort only as a tie-break. The primary sort is open points descending.
- Sample data includes one overloaded person and one even-load fixture where this list is empty. Tests cover both.
- The threshold is computed from the current sprint load on each page load. It is not a stored team setting.
- Show the median and the threshold rounded to one decimal place. Apply the comparison to the exact values.
- A person who meets the median test and misses the 5 point floor is omitted. The row must not appear “almost overloaded.”

#### Which issues count

Stories, bugs, and tasks count toward story points and toward every attention list. Subtasks are excluded, so a parent’s points are not added again through its children.

- Issue type is matched on the type name, case-insensitive: Story, Bug, and Task.
- A subtask is any issue whose type is Sub-task or Subtask, or whose parent field is set and whose type is not Story, Bug, or Task. Excluded either way.
- Epics, spikes saved as a custom type, and other types are excluded from points and from all four lists. They do not appear as their own rows.
- Done stories, bugs, and tasks stay in the point totals. They do not appear on Blocked, Overdue, or Unassigned. Their points are not open, so they do not feed Overloaded.
- An excluded issue’s flag, due date, or empty assignee cannot place it on a list.
- If a parent and a subtask both carry points, only the parent’s points are added. The subtask’s points are dropped, not subtracted.
- Issue type comes from the sample file or from Jira’s issue type field. The app does not reclassify work by summary text.
- The sample sprint contains one subtask under a counted story. Tests assert the subtask key is absent and the parent points appear once.
- Counted types are only Story, Bug, and Task. A type named “User Story” is not a Story match. The sample uses the three exact names.
- Exclusion happens before list rules and before point sums. Later rules must not see dropped issues.
- A bug counts the same as a story for points and for every list. There is no separate bug section.
- Tasks count the same way. A task with no points can still be blocked, overdue, or unassigned.
- The type is shown on the row only as part of the data model. The list does not need a type column to be correct.
- A story’s children are not walked to discover extra points. The issue list from the sprint is filtered, not expanded.

#### Done and estimates

- An issue is done when its Jira status category is Done. The status name can be Done, Closed, Resolved, or a team-specific name. The category is what matters.
- Status category To Do or In Progress is not done, including a status named “Done” if the category were ever not Done. Trust the category field only.
- In sample data the category is stored on the issue. In live data it is the status category returned with the issue.
- An issue with no story points counts as zero toward the commitment and the overload rule. It still appears on an attention list when it matches that list’s rule.
- No story points means null, missing, or a non-numeric value. Zero is a real estimate and stays zero. Negative values are treated as missing and count as zero.
- Story points are not rounded before they are summed. Display of a row may show the original number. Totals use the sum of those numbers.
- The field is Jira story points. Time estimates and remaining time are not a substitute when points are missing.
- A done issue with no points adds zero to done points and zero to committed points beyond that zero. It cannot by itself create a commitment.
- Status category names are Done, In Progress, and To Do. Only Done means done.
- An issue with category Done is done even when the resolution field is empty. Resolution is not read.
- Remaining estimate is not displayed and not summed.
- Original estimate is not a fallback for story points.
- The zero-point rule applies in sample mode and live mode with the same code path.
- Tests include one open issue with null points on the unassigned list and in a commitment total of the other issues only.
- Fractional story points such as 0.5 are allowed. They are summed as numbers, not rounded to a whole point first.

#### Data

- **Default.** Built-in sample data with the same shape as a Jira sprint: issues, points, assignees, blockers, due dates, sprint dates, and a sprint goal. The page works with no credentials.
- **Live.** `DATA_SOURCE=live` switches the same page to the active sprint of one Jira board. The site URL, board, account email, and API token come from the environment.
- The page shows the same health snapshot in both modes. Only the source of the numbers changes. Mapping into the sprint model happens before the rules run.
- Sample data includes at least one case for each status band and each attention list, plus one even-load case so Overloaded can be empty, and one issue that sits on two lists.
- Sample data also includes a subtask, a done issue, an issue with no points, an issue with no due date, and a sprint goal string that can be cleared in a second fixture for the empty-goal test.
- The sample file lives in the repo and is safe to commit. It contains no tokens, emails, or internal URLs.
- Live mode sends basic auth with `JIRA_EMAIL` and `JIRA_API_TOKEN`. It requests the active sprint for `JIRA_BOARD_ID` and then the issues in that sprint.
- Live mode requests the fields the rules need: summary, issuetype, status, assignee, duedate, story points, flag, and issue links. It does not request comments or attachments.
- If a required live variable is missing, the page shows which variable name is missing and does not call Jira. The token value is never included in that message.
- A live HTTP error or a JSON shape the mapper cannot read shows an error in the summary region and no fabricated issue rows.
- The mapper’s output is the only input to the health rules. Templates do not read raw Jira JSON.
- Sample JSON uses ISO dates and null for missing assignee, points, and due date.
- A second sample fixture may override the goal text with null for the empty-goal test. The default fixture has a non-empty goal.
- Board id, email, and token are unused in sample mode even if they are present in the environment.
- Switching `DATA_SOURCE` requires a new process start or a reload that re-reads the environment. The page has no toggle button.

#### Delivery

- A local web page, started from this project and opened in the browser. The start command prints a localhost URL.
- The sprint-goal status is saved in a file next to the app and kept across refresh and restart.
- The repo contains the app, templates, sample JSON, requirements file, and tests. A new clone runs sample mode after installing those requirements.
- No database install, no Jira app install, and no browser extension are required.
- The goal-status file is created on the first successful save. It is not committed. The README states the path and the three allowed values.
- Sample mode is the default when `DATA_SOURCE` is unset. A reviewer can follow the success criteria without a Jira site.
- Live mode is optional and documented as environment variables. The README lists the variable names and the read-only token permission.
- The page is usable at a normal laptop width. The summary appears before the lists in document order so a narrow window still shows health first.
- Install steps are short: create a virtualenv, install `requirements.txt`, run `python app.py`, open the URL.
- The default run needs no `.env` file. Adding `.env` is how a developer turns on live mode.
- The goal-status path is created if the parent data directory is missing at save time.
- Tests run with `pytest` and do not start a browser.
- A browser check is still part of delivery: load sample mode and confirm the summary and four headings render.
- The README points at this spec for the rules and does not restate a second, conflicting ruleset.
- Shutting down the process is stopping that Python process. No separate service remains.

### Non-functional

- Sample mode makes no network call and starts with no credentials. Tests that cover sample mode fail if a socket is opened.
- Live mode is read-only. The only HTTP methods used against Jira are GET. A failed Jira call shows an error on the page and leaves the last saved goal status untouched.
- The API token and email are read from the environment. They are not rendered, logged, or committed. Error text may include the variable name and the HTTP status code, not the header value.
- Saving the goal status writes the file and flushes it before the page reloads, so a refresh shows the new value. A crash during write must not leave a partial JSON file that the next load treats as a valid status. Write to a temporary file and replace the target.
- The summary is above the four lists. A manager can read on-track status without scrolling through the lists on a 1280 pixel wide window.
- One local process. No database and no account system. The Flask process is the whole app.
- The page responds for the sample sprint without a spinner requirement. Live mode may wait on Jira, and the browser shows the result or the error, not a blank document.
- Status colors are not the only signal. Each status is also a text label, so the bands remain clear without color.
- The goal-status form works with HTML controls. It does not depend on JavaScript to save.
- `.env`, the goal-status file, and virtualenv directories stay out of git, matching the existing ignore rules.
- The app listens on localhost. It does not enable directory listing or a debug console that prints request headers in this version’s default start.
- Repeated loads of unchanged sample data produce the same labels, the same list membership, and the same row order.
- The sample page’s HTML includes the status words as text, not only as CSS class names.
- Logs for a normal sample request do not include issue descriptions beyond the key, and never include env values.
- A missing template or sample file fails at startup with a clear file error rather than a blank 200 page.

## Constraints

The first version is a local, read-only view of one sprint plus one local judgment. The limits below are part of the design. They keep the build small enough to run on a single machine and small enough to test without a Jira admin project.

Nothing in this version may require a paid hosting account, a shared database, or a change to the team’s Jira workflow. If a behavior needs one of those, it belongs in a later version.

The success criteria are the acceptance test for these limits. A feature that breaks sample mode, writes to Jira, or needs a second board is outside the constraint even if it would be useful.

Calendar dates, one file for goal status, and one process are deliberate. They are not placeholders for a later scheduler or a multi-user store in this same version.

- Technical constraints cover Jira Cloud, localhost, JSON files, and read-only access.
- Time constraints cover this version’s boundary: the success criteria, not a calendar deadline and not later-version work.
- Resource constraints cover one machine, one token, and a small sample sprint.
- A constraint overrides a nice-to-have in the same document. The non-goals list the same boundary in plainer language.
- The app may page Jira’s search API internally. That is an implementation detail, not a second product feature.
- No constraint requires a particular IDE, operating system, or browser extension.
- Windows, macOS, and Linux are all acceptable as the one developer machine, as long as Python 3.11 runs.
- The local file and the sample file are UTF-8 JSON.
- Secrets are a constraint, not only a wish. Committing a token fails the version.
- The single-sprint rule is a constraint. Code that accepts a sprint id parameter is extra and not required.
- If a Jira response is larger than one sprint, only the active sprint’s issues are kept. The rest are discarded.

### Technical

- One board and its active sprint. The app does not write to Jira. It does not transition issues, edit fields, or add comments.
- Jira Cloud basic auth needs a site URL, account email, board id, and API token with permission to read that board and its issues. Jira Server and Jira Data Center are not targets of this version.
- No database. Sample data and the goal-status file are local JSON. SQLite and hosted stores are out of this version.
- The goal-status file is single-user. Concurrent editors are not supported. The last successful write wins if two browsers on the same machine post together. That race is accepted.
- Elapsed time uses the server’s calendar date and the sprint start and end dates from the data source. The app does not apply a team timezone setting or a working-day calendar.
- Live mode depends on Jira being reachable from the machine running the app. There is no offline cache of live issues and no retry queue.
- Story points must be the Jira story point field. If the site uses a differently named numeric field, this version does not map it. Sample mode is unaffected.
- The blocked flag is the Jira impediment flag. Custom “blocked” checkboxes are ignored unless they surface as that flag, the status name Blocked, or an “is blocked by” link.
- The process is stateful only through the goal-status file. Restarting the process does not keep memory. It rereads sample data or Jira and rereads the file.
- HTML is rendered by the server. The goal text is escaped. Issue summaries from Jira are escaped. The page does not inject unsanitized API text into the document.
- Dependencies stay in `requirements.txt`. The app does not shell out to the Jira CLI or a browser automation tool.
- Locale is the machine default for “today”. Display dates use ISO dates (`YYYY-MM-DD`) so the sample and the page can be compared without a locale puzzle.
- The board id is a number taken from the environment. The page does not call the board list API to offer choices.
- HTTPS is the expected scheme for `JIRA_SITE_URL`. The app does not disable certificate checks.
- Query parameters that select a different sprint are not part of the page URL in this version.

### Time

- This document is the whole first version. No delivery date is set beyond meeting the Success Criteria.
- Later versions (board switcher, multi-team) are not part of this build and are not scheduled here.
- The build is done when the success criteria pass on sample data and the live path is implemented behind the environment switch. A live Jira site is not required to mark the sample path done.
- There is no sprint-long beta, no migration window, and no backwards-compatible file format beyond the single `status` field.
- Historical snapshots are not stored, so there is no backfill task and no nightly job to operate.
- Review time is a local read of the page plus the automated tests. There is no staging environment to promote.
- The elapsed-time rule uses the wall calendar only. Building a business-day calendar is not part of the schedule for this version.
- Empty states, the three status bands, and the four lists ship together. A partial page that shows only the summary does not meet the version.
- Documentation time is the README start steps and the variable names. A separate user manual is not required.
- Bug fixes for the rules in this spec are in version scope. New list types are not, even if they would be quick.
- The version does not wait on a Jira admin to install an app. A personal API token is enough for the optional live path.
- Sample data is maintained by hand for the fixtures the tests need. There is no import project to plan.
- The version is not blocked on a design review beyond this spec. The page can stay plain.
- Writing the live client is in scope. Hardening it for several Jira sites is not a scheduled follow-up inside this version.
- Rule bugs found against this spec are fixed in this version. Scope additions wait.

### Resource

- The app runs on the developer’s machine and is opened in a local browser. One CPU process is enough.
- Sample mode needs no Jira account and no network. Disk need is the repo plus one small JSON status file.
- Live mode needs network access to the Jira site and one API token. It does not need a service account shared by the team.
- Memory is whatever Flask needs to hold one sprint’s issues. This version does not stream or paginate in the UI. The implementation may page the Jira search internally until the sprint’s issues are loaded.
- No GPU, queue, or cache server is required. No background worker is required.
- The token’s owner must be allowed to browse the board. The project does not provision that permission.
- Log output stays on the local console. There is no log shipping and no metrics account.
- The goal-status file is the only growing local state, and it stays a single JSON object. It does not become a history log.
- Developers need Python 3.11 or newer and the packages in `requirements.txt`. They do not need a Jira SDK license.
- Browser support is a current Chrome, Edge, or Firefox. The page uses a form and CSS, not a specific device.
- Secrets stay in the environment of that one machine. Sharing them in chat or committing them is outside how this app is meant to be run.
- The sample sprint is small on purpose, enough to hit each rule. Loading a multi-year issue archive is not a resource this version plans for.
- One developer can run and test the app. No shared lab environment is required.
- Disk for dependencies is a normal virtualenv. The repo does not vendor wheels.
- Network use is zero in sample mode and one site in live mode. No other host is required.

## Non-Goals

Explicitly out of scope for this version:

- More than one team or board on the page, including a board switcher. One `JIRA_BOARD_ID` is the whole live scope.
- Past sprints, sprint history, and trend charts. The page does not store yesterday’s snapshot to draw a line.
- Confluence, meeting notes, or release checklists. Those ideas stay in the project idea list and are not data sources here.
- Counting subtasks toward points or attention lists. Parents already carry the points.
- Treating a missing due date, or a sprint that is about to end, as overdue. Only a due date before today, on a not-done counted issue, is overdue.
- Creating or updating Jira issues, assignees, comments, or the sprint goal text. The manager sets only the local goal status.
- A login screen, user accounts, or a hosted multi-user deployment. The process is local and has no password form.
- Email, Slack, or scheduled digests. Nothing sends itself on a timer.
- Editing story points, due dates, or assignees on the dashboard. Those fields are displayed from the data source.
- A combined health score that collapses the points signal and the goal judgment into one number.
- Working-day calendars, team timezones, and capacity plans based on hours. Elapsed time is calendar days. Overload is open story points.
- Forecasting the sprint end from velocity. The page compares current completed percent with elapsed percent only.
- Custom Jira workflows beyond the three blocked signals and the Done status category. Review columns are not a fifth list.
- Notifications when a list changes. The manager sees the change on the next page load.
- Mobile applications, browser extensions, and Jira marketplace apps. Delivery is the local web page.
- Importing or exporting CSV, and printing a PDF report. The browser page is the output.
- Internationalization of the labels. The status words and list headings are English in this version.
- Mapping a non-standard story-point custom field. Sites that need that mapping are not supported yet.
- Automatically setting the goal status from the points gap. The judgment stays manual even when the gap is Off track.
