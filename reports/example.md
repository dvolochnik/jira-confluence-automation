# Status Report

| Field | Value |
| --- | --- |
| Project | Sprint Health Dashboard |
| Period | 2026-09-22 to 2026-09-29 |
| Author | Jordan Lee |
| Date | 2026-09-29 |
| Overall status | At risk |

## Summary

The sprint is at risk. Completed story points are 11.7 percentage points behind elapsed time, inside the at-risk band. Sample mode is demoable with no credentials. The decision that cannot wait is whether to drop live Jira mode from this sprint or unblock the API token so it can still land.

## Progress

- Sample sprint data renders the health snapshot: points versus time, sprint goal, and the four attention lists.
- Goal status saves to a local file and stays after refresh.
- Rule tests cover the 15-point band, missing due dates, subtasks, and the overload thresholds.

## Sprint health

| Signal | Status | Notes |
| --- | --- | --- |
| Story points versus time | At risk | 55.0% of committed points done (22 of 40). 66.7% of sprint days have passed (8 of 12, 2026-09-22 to 2026-10-03). Gap is 11.7 percentage points. |
| Sprint goal | At risk | Goal: "A manager can judge sprint health from sample data, with a path to one live Jira board." Sample mode meets the first half. Live mode is not wired. |

## Needs attention

### Blocked

- PROJ-41 "Read the active sprint from Jira." Flagged as an impediment. Waiting on an API token for the demo board.

### Overdue

- PROJ-28 "Persist goal status across refresh." Due 2026-09-26. Still in progress. (The file write works; the form post is not finished.)

### Unassigned

- PROJ-33 "Show an error when the board has more than one active sprint." Bug, no assignee, not done.

### Overloaded

- Sam Okonkwo: 13 open points. Median open points on the team is 6. 13 is more than 1.5 times that median (9) and at least 5.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Live mode stays blocked through the sprint end on 2026-10-03 | The build has a sample demo but misses the required live path | Decide this week: supply a token or move live mode to the next sprint and record that in the spec |
| PROJ-28 slips past its due date | Goal status looks saved in sample runs and is lost on refresh in the real form | Finish the form post before any other page work |

## Next period

- Close PROJ-28 so the goal-status form post matches the file already on disk.
- Assign PROJ-33 and show the multiple-active-sprint error.
- Either connect live mode to one board or cut it from this sprint in writing.

## Decisions needed

- Provide a Jira API token for the demo board, or accept that this version ships sample mode only.
- Reassign enough of Sam Okonkwo's open points that the overload list clears.
