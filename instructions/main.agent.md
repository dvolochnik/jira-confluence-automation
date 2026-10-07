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
  + Exceptions: does not apply in sample mode; when `DATA_SOURCE` is unset, propose the default source `sample` and do not call Jira; does not cover health bands, page rendering, or the goal-status file
