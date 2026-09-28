# Project Ideas: Jira / Confluence Automations for Managers

## 1. Weekly Sprint Health Digest

**Problem it solves**  
Managers spend time chasing status across boards and meetings. A scheduled digest surfaces blockers, overdue work, and sprint risk without opening Jira.

**Data it needs**
- Jira project/board and active sprint
- Issue fields: status, assignee, priority, due date, story points
- Blocked / “Impediment” flags or linked blocker issues
- Sprint start/end dates and commitment (planned vs remaining)

## 2. Decision Log Sync (Meeting Notes → Jira)

**Problem it solves**  
Decisions in Confluence meeting notes often never become tracked work. Automation creates or updates Jira issues from tagged decisions so ownership and follow-up are clear.

**Data it needs**
- Confluence page/space for meeting notes
- Structured markers (e.g. `Decision:`, owner, due date)
- Target Jira project, issue type, and default labels
- Mapping of Confluence user mentions → Jira assignees

## 3. Release Readiness Checklist from Confluence

**Problem it solves**  
Release go/no-go depends on scattered Confluence checklists and open Jira defects. Automation aggregates readiness so managers see gaps before ship date.

**Data it needs**
- Confluence release/runbook page with checklist items
- Linked Jira fix version or release
- Open bugs/regressions by severity for that version
- Owners and due dates for unfinished checklist items
