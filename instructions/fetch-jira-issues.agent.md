- Fetch and format one Jira Cloud board's active sprint into the shared sprint model. Stop at that model. Do not compute health bands, render a page, or write goal status.
- Run the live fetch only when `DATA_SOURCE` is `live`. When it is `sample`, do not call Jira and do not read the Jira variables.
- When `DATA_SOURCE` is unset, the Jira source is missing. Do not call Jira and do not read the Jira variables. Propose the default source `sample` and wait for the user to accept it. Do not load sample data on your own.

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
  + Present the issues list as one markdown table. Do not use a prose paragraph or a nested bullet for each issue.
  + Columns, in order: `key`, `summary`, `type`, `statusName`, `statusCategory`, `storyPoints`, `assignee`, `dueDate`, `flagged`, `blockers`.
  + One row per issue. Put `name`, `goal`, `startDate`, and `endDate` in labeled lines above the table, not as extra columns.
  + The `assignee` cell is `displayName`, or `null` when the assignee is null. Do not put `accountId` in the table.
  + The `blockers` cell is comma-separated keys, or empty when there are none.
  + Write a missing points value or due date as `null`. Write `flagged` as `true` or `false`.
  + A filtered selection, such as the most urgent, the biggest, or a requested count, uses the same columns and only the selected rows.

- **Constraints.**
  + Jira Cloud only. Jira Server and Jira Data Center are out of scope.
  + One board and its active sprint. Do not call the board-list API. Do not accept a sprint id parameter.
  + Read-only. No POST, PUT, or DELETE. Do not transition issues, edit fields, or add comments.
  + Do not log or return `JIRA_EMAIL`, `JIRA_API_TOKEN`, or the `Authorization` header.
  + Do not fall back to sample JSON when the live call fails.
  + Do not change `data/goal_status.json`.
  + Do not shell out to a Jira CLI or a browser.
