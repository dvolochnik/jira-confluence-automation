# Module 10 Completion Report

## Instruction Files

```
    Directory: C:\Local\workspace\hello-genai\work\module03-task\instructions


Mode                 LastWriteTime         Length Name                                                                 
----                 -------------         ------ ----                                                                 
-a----         10/2/2026   5:18 PM           1172 create-status-report.agent.md                                        
-a----         10/5/2026   1:15 PM          16576 creating-instructions.agent.md                                       
-a----         10/5/2026   1:38 PM           3867 fetch-jira-issues.agent.md                                           
-a----         10/5/2026   1:39 PM           1562 main.agent.md                                                        
```

## main.agent.md Contents

```
# Instructions Catalog

Each entry below is an instruction file with a one-line description. Optional sub-fields after `+`:
- **Keywords** — trigger words/phrases: if user's request matches, load this instruction.
- **Target** — file glob pattern: if current file or context matches, consider this instruction relevant.
- **Exceptions** — edge cases or clarifications that don't fit in the one-liner.

---

- [`./instructions/creating-instructions.agent.md`](./creating-instructions.agent.md) — Create, update, and install platform-agnostic instructions and their IDE wrappers.
  + Keywords: create instruction, update instruction, instruction catalog, shortcut-links, cursor rules, install instructions
  + Target: `instructions/**/*.md`, `.cursor/rules/**/*.mdc`
- [`./instructions/create-status-report.agent.md`](./create-status-report.agent.md) — Weekly status report with fixed sections and format.
  + Keywords: status report, weekly report, accomplishments, blockers, next week
  + Target: `reports/**/*.md`, `work/*-report.md`
  + Exceptions: does not apply when filling the Sprint Health Dashboard report described in `reports/instructions.md`
- [`./instructions/fetch-jira-issues.agent.md`](./fetch-jira-issues.agent.md) — Fetch and format one board's active sprint issues from the Jira Cloud API.
  + Keywords: Jira, Jira API, fetch issues, format issue data, live mode, active sprint
  + Target: `**/*jira*`, `app.py`
  + Exceptions: does not apply in sample mode, and does not cover health bands, page rendering, or the goal-status file
```

## Sample Instruction
- File: `instructions/fetch-jira-issues.agent.md`
- Contents:

```
- Fetch and format one Jira Cloud board's active sprint into the shared sprint model. Stop at that model. Do not compute health bands, render a page, or write goal status.
- Run this only when `DATA_SOURCE` is `live`. When it is `sample` or unset, do not call Jira and do not read the Jira variables.

- **Input format.** Four environment variables, all required before any HTTP call:
  + `JIRA_SITE_URL` — HTTPS origin only, such as `https://example.atlassian.net`. No path after the host.
  + `JIRA_BOARD_ID` — one numeric board id.
  + `JIRA_EMAIL` — Atlassian account email. Basic-auth username.
  + `JIRA_API_TOKEN` — API token. Basic-auth password. Read it from the environment only.
  + If any variable is missing, or `JIRA_SITE_URL` is not that shape, stop. Name the variable. Do not include its value. Do not call Jira.

- **Processing steps.**
  + Send HTTP Basic auth with `JIRA_EMAIL` and `JIRA_API_TOKEN`. Use GET only. Do not disable certificate checks.
  + Read active sprints: `GET {JIRA_SITE_URL}/rest/agile/1.0/board/{JIRA_BOARD_ID}/sprint?state=active`.
  + Zero items in `values`: stop with a clear empty-sprint message. Do not load sample data. Do not use the last closed sprint.
  + More than one item in `values`: stop with an error. Do not pick one.
  + Load that sprint's issues: `GET {JIRA_SITE_URL}/rest/api/3/search/jql` with JQL `sprint = {sprintId}`.
  + Request only `summary`, `issuetype`, `status`, `assignee`, `duedate`, `issuelinks`, the story points field, and the flagged field. Do not request `comment` or `attachment`.
  + Page with `nextPageToken` until the token is absent. Then drop any issue that is not in that sprint.
  + Read story points from the Jira story points field. If the site uses a differently named numeric field, leave points null. Do not add a mapping. Do not substitute original estimate, remaining estimate, or time spent.
  + Read the flagged bit from the Jira impediment flag only. Ignore a custom blocked checkbox.
  + On an HTTP error or a JSON shape that cannot be mapped, stop. Report variable names and the HTTP status code only. Return no issue rows.

- **Output format.** One sprint object. Dates are `YYYY-MM-DD` or null. A missing assignee, points value, or due date is null, not an empty string.
  + Sprint fields: `name`, `goal` (text or null), `startDate`, `endDate`, `issues`.
  + Each issue: `key`, `summary`, `type` (issue type name), `statusName`, `statusCategory` (`Done`, `In Progress`, or `To Do`), `storyPoints` (number or null, including `0` and fractions such as `0.5`), `assignee` (`accountId` and `displayName`, or null), `dueDate`, `flagged` (boolean), `blockers` (issue keys).
  + `assignee` is null only when both account id and display name are missing. A display name of `Unassigned` on a real account stays an assignee. A deactivated account stays an assignee.
  + `flagged` is true only when the impediment flag is set.
  + `blockers` lists keys from inward links whose inward description is `is blocked by`. An outward `blocks` link does not add a key. A blocker outside the sprint is still listed and is not added as its own issue.
  + `dueDate` is the calendar date. Drop the time of day.
  + The same input must produce the same object. Do not invent keys, points, assignees, or dates.

- **Constraints.**
  + Jira Cloud only. Jira Server and Jira Data Center are out of scope.
  + One board and its active sprint. Do not call the board-list API. Do not accept a sprint id parameter.
  + Read-only. No POST, PUT, or DELETE. Do not transition issues, edit fields, or add comments.
  + Do not log or return `JIRA_EMAIL`, `JIRA_API_TOKEN`, or the `Authorization` header.
  + Do not fall back to sample JSON when the live call fails.
  + Do not change `data/goal_status.json`.
  + Do not shell out to a Jira CLI or a browser.
```
