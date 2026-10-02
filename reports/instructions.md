# How to fill out the status report

Use `template.md` as the starting point. Copy it, replace every placeholder, and save the result as a dated file in this folder (for example `2026-09-29-status.md`). Keep the headings. A reader should be able to scan the header and the summary without opening Jira.

## Header

| Field | What to write |
| --- | --- |
| Project | The product name. For this work, that is Sprint Health Dashboard. |
| Period | The reporting window, as start date and end date. Use calendar dates (`YYYY-MM-DD`). |
| Author | The person writing the report. |
| Date | The day the report is written, not the end of the period if those differ. |
| Overall status | One of **On track**, **At risk**, or **Off track**. This is your judgment of the whole period, not a copy of a single signal. |

## Summary

Write one paragraph. Answer two questions:

1. Is the team on track to finish what it committed to?
2. What is the one thing a manager should act on?

Do not list every ticket. The lists below carry the detail.

## Progress

Use short bullets for work that moved in this period: features shipped, rules locked, tests added, or decisions made. Past tense. Skip work that is still only planned; that belongs in Next period.

## Sprint health

Two rows, matching the dashboard:

- **Story points versus time.** Compare the percent of committed story points that are done with the percent of sprint days that have passed.
  - **On track** when completed percent is at or ahead of the elapsed-time percent.
  - **At risk** when completed percent is behind by up to 15 percentage points.
  - **Off track** when completed percent is behind by more than 15 percentage points.
- **Sprint goal.** Paste the goal text from Jira in Notes. The status is the manager's judgment (On track, At risk, or Off track). Jira does not supply that status. The two signals may disagree.

Show percents to one decimal place. The band uses the exact gap.

## Needs attention

Four lists. Each stays short. Leave the list body empty when nothing matches so it is clear the check ran.

- **Blocked.** An item is blocked when it is flagged as an impediment, its status is Blocked, or it has an "is blocked by" link. One item, one bullet. Say which signal matched.
- **Overdue.** Due date is before today and the item is not done. No due date means not overdue. A sprint that is about to end does not, by itself, make items overdue.
- **Unassigned.** Counted work with no assignee.
- **Overloaded.** A person whose open story points are more than 1.5 times the median among people who still have work, and at least 5 points open. When load is even, leave this list empty.

Stories, bugs, and tasks count. Subtasks do not. An item with no story points still appears on a list when it matches that list's rule. The same item may appear on more than one list.

## Risks

One row per risk that could change the overall status before the next report. Name the impact in plain language and the mitigation already in place or the next step. Do not repeat items that are already on a Needs attention list unless the risk is broader than that single item.

## Next period

Three bullets is enough. These are the outcomes you intend to reach before the next report, not a full backlog.

## Decisions needed

Bullets for choices only a manager (or someone outside the team) can make: unblock, reassign, drop scope, or accept a risk. If none, write "None."

## Tone and length

Keep the report to about one page. Use the status words On track, At risk, and Off track exactly. Dates are calendar dates. Do not paste secrets, API tokens, or board credentials into the report.
