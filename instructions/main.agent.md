# Instructions Catalog

Each entry below is an instruction file with a one-line description. Optional sub-fields after `+`:
- **Keywords** — trigger words/phrases: if user's request matches, load this instruction.
- **Target** — file glob pattern: if current file or context matches, consider this instruction relevant.
- **Exceptions** — edge cases or clarifications that don't fit in the one-liner.
- **Status** — `battle-tested` when the instruction has been used and refined in a real session.

---

- [`./instructions/creating-instructions.agent.md`](./creating-instructions.agent.md) — Create, update, and install platform-agnostic instructions and their IDE wrappers.
  + Keywords: create instruction, update instruction, instruction catalog, shortcut-links, cursor rules, install instructions
  + Target: `instructions/**/*.md`, `.cursor/rules/**/*.mdc`
  + Status: battle-tested
- [`./instructions/create-status-report.agent.md`](./create-status-report.agent.md) — Weekly status report with fixed sections and format.
  + Keywords: status report, weekly report, accomplishments, blockers, next week
  + Target: `reports/**/*.md`, `work/*-report.md`
  + Exceptions: does not apply when filling the Sprint Health Dashboard report described in `reports/instructions.md`
  + Status: battle-tested
- [`./instructions/fetch-jira-issues.agent.md`](./fetch-jira-issues.agent.md) — Fetch and format one board's active sprint issues from the Jira Cloud API as a structured table.
  + Keywords: Jira, Jira API, fetch issues, format issue data, live mode, active sprint, structured table, issues table
  + Target: `**/*jira*`, `app.py`
  + Exceptions: does not apply in sample mode; when `DATA_SOURCE` is unset, propose the default source `sample` and do not call Jira; does not cover health bands, page rendering, or the goal-status file
  + Status: battle-tested
- [`./instructions/calculate-compound-interest.agent.md`](./calculate-compound-interest.agent.md) — Calculate compound interest with `tools/compound_interest.py` and present the final amount and interest earned.
  + Keywords: compound interest, compound_interest.py, final amount, interest earned, annual rate, compounds per year
  + Target: `tools/compound_interest.py`
  + Exceptions: does not apply to simple interest or loan amortization
- [`./instructions/use-normalize_story_points.agent.md`](./use-normalize_story_points.agent.md) — Normalize and sum story points with `tools/normalize_story_points.py`.
  + Keywords: normalize story points, story points, normalize_story_points.py, fractional points, missing points, null points
  + Target: `tools/normalize_story_points.py`
  + Exceptions: does not apply when displaying one issue's original points, or when rounding a median or threshold for display
- [`./instructions/use-compute_committed_done_points_completed percent.agent.md`](./use-compute_committed_done_points_completed%20percent.agent.md) — Compute committed points, done points, and completed percent with `tools/compute_committed_done_points_completed percent.py`.
  + Keywords: committed points, done points, completed percent, status category Done, counted issues, compute_committed_done_points_completed percent.py
  + Target: `tools/compute_committed_done_points_completed percent.py`
  + Exceptions: does not apply to elapsed percent, the points-versus-time gap, or On track, At risk, and Off track bands; does not apply when the task is only to normalize or sum point values
- [`./instructions/elapsed_percent_and_health gap.agent.md`](./elapsed_percent_and_health%20gap.agent.md) — Calculate elapsed percent, the points-versus-time gap, and the health band with `tools/elapsed_percent_and_health gap.py`.
  + Keywords: elapsed percent, health gap, points versus time, On track, At risk, Off track, elapsed_percent_and_health gap.py
  + Target: `tools/elapsed_percent_and_health gap.py`
  + Exceptions: does not apply to committed points, done points, or completed percent; does not set the sprint-goal judgment; does not apply when sprint dates are missing

