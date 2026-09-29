# Sprint Health Dashboard

Requirements for the first version. The dashboard shows one team’s active sprint as a health snapshot: whether the sprint is on track, then the items a manager needs to act on.

## Purpose

A manager opens one page and, in a short look, learns two things:

1. Whether the sprint is on track to finish what the team committed to.
2. Which blocked, overdue, unassigned, or overloaded work needs a decision.

## Users and scope

- **User.** A manager of one team.
- **Scope.** One team and its active sprint.
- A board switcher and a multi-team page are later versions.

## On track

The top of the page has two signals.

### Story points versus time

Compare the percent of committed story points that are done with the percent of sprint days that have passed.

| Status | Rule |
| --- | --- |
| On track | Completed percent is at or ahead of the elapsed-time percent |
| At risk | Completed percent is behind by up to 15 percentage points |
| Off track | Completed percent is behind by more than 15 percentage points |

### Sprint goal

- The goal text comes from Jira.
- The manager sets a separate goal status on the dashboard: on track, at risk, or off track.
- That status is a judgment. Jira does not supply it.

## Needs attention

Four lists sit under the on-track summary. Each list stays short. The same issue may appear on more than one list when it matches more than one rule.

### Blocked

An issue is blocked when any of these is true:

- It is flagged in Jira (Flagged = Impediment).
- Its status is Blocked.
- It has an “is blocked by” link.

One issue appears once. The row shows which signal matched.

### Overdue

An issue is overdue when its due date is before today and it is not done. An issue with no due date is not overdue. The sprint end date feeds the on-track signal and does not, by itself, mark issues overdue.

### Unassigned

An issue is unassigned when it has no assignee.

### Overloaded

A person is overloaded when both are true:

- Their open story points are more than 1.5 times the median open points among people who still have work.
- They have at least 5 story points open.

When the team’s load is even, this list is empty.

## Which issues count

Stories, bugs, and tasks count toward story points and toward every attention list. Subtasks are excluded, so a parent’s points are not added again through its children.

## Done and estimates

- An issue is done when its Jira status category is Done.
- An issue with no story points counts as zero toward the commitment and the overload rule. It still appears on an attention list when it matches that list’s rule.

## Data

- **Default.** Built-in sample data with the same shape as a Jira sprint: issues, points, assignees, blockers, due dates, sprint dates, and a sprint goal. The page works with no credentials.
- **Live.** A setting switches the same page to the active sprint of one Jira board. The site URL, board, and API token come from the environment.
- The page shows the same health snapshot in both modes. Only the source of the numbers changes.

## Delivery

- A local web page, started from this project and opened in the browser.
- The sprint-goal status is saved in a file next to the app and kept across refresh.

## Out of scope for this version

- More than one team or board on the page.
- Past sprints.
- Confluence, meeting notes, or release checklists.
- Counting subtasks toward points or attention lists.
- Treating a missing due date, or a sprint that is about to end, as overdue.
