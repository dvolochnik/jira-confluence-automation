<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0
- Bump rationale: MINOR. New sections and expanded guidance. No principle removed or redefined.
- Modified principles:
  - I. Strict Layer Boundaries — runtime versions now match the Technology Stack pins
  - II. Test-Backed Automation — database tests target PostgreSQL 15.19
  - IV. Docker-Portable Runtime — image pin is postgres:15.19; Node image pin is node:24.21.0
  - V. Small Surface — new modules follow Folder Structure and Coding Standards
- Added sections:
  - Project
  - Folder Structure
  - Coding Standards
- Removed sections: none
- Expanded sections: Technology Stack, Development Workflow
- Follow-up TODOs: none
-->

# Jira/Confluence Automation Constitution

This constitution governs the Jira/Confluence Automation project. It binds
specifications, plans, tasks, and implementation.

## Project

- **Name.** Jira/Confluence Automation.
- **Purpose.** Run repeatable jobs against one Jira Cloud site and its
  Confluence space: read issues and pages, apply automation rules, and write
  back only when the operator starts a named action. Each run is stored in
  PostgreSQL so the operator can see what was read, what was written, and
  what failed.
- **Target user.** One team lead who operates automations for that site and
  space. This person starts jobs and reviews outcomes. There is no separate
  view for a team member, a stakeholder, or an administrator of many sites.

## Core Principles

### I. Strict Layer Boundaries

The three runtime layers stay separate, and every change MUST preserve that split.

- **Presentation.** The frontend is React 18.3.1, built and served with Vite
  8.3.4. It renders the UI and calls this project's Express API only. It MUST
  NOT call Jira, Confluence, or PostgreSQL directly, and it MUST NOT hold
  automation rules or credential material.
- **Application.** The backend is Node.js 24.21.0 with Express 5.2.1. It owns
  HTTP routes, Jira and Confluence clients, automation rules, validation, and
  persistence. Business rules MUST run on the backend before any result
  reaches the UI.
- **Data.** PostgreSQL 15.19 is the system of record for application state.
  Schema changes go through versioned migrations. The database MUST be reached
  only from the backend.

**Rationale:** One place for rules and credentials keeps Atlassian integrations
testable and keeps secrets and vendor payloads out of the browser.

### II. Test-Backed Automation (NON-NEGOTIABLE)

Every behavior that decides what to read, write, or skip in Jira or Confluence
MUST have an automated test.

- Tests use fixtures or a local PostgreSQL 15.19 instance. They MUST NOT open
  a socket to Atlassian.
- A rule change updates its test in the same change. Dropping a test to make
  the suite pass is forbidden.
- External HTTP is stubbed. A live Jira or Confluence call is an explicit,
  opt-in integration path and stays out of the default suite.
- Database tests run against PostgreSQL 15.19, the same version the
  application uses.

**Rationale:** Automation that changes tickets and pages is safe only when the
rules are locked by tests that do not depend on a live site.

### III. Explicit, Least-Privilege Atlassian Access

Access to Jira and Confluence is deliberate, minimal, and auditable.

- Credentials (site URL, account email, API token) come from the environment
  or a local untracked env file. They MUST NOT appear in source, fixtures,
  logs, HTML, or the database.
- Reads are the default. A write to Jira or Confluence MUST name its target
  and record its outcome.
- The client requests only the scopes and fields the feature needs.
- A failed remote call leaves local state consistent. Partial writes MUST be
  visible in logs and in stored job status.

**Rationale:** Tokens and unlogged writes are the main ways this automation
can expose data or change the wrong Jira or Confluence content.

### IV. Docker-Portable Runtime

The supported way to run the stack is Docker Compose from the repository root.

- PostgreSQL uses the image `postgres:15.19`.
- The backend image is based on `node:24.21.0`. The frontend build uses the
  same Node.js version.
- The React frontend and the Express backend start from the same Compose file
  and bind to localhost.
- Configuration that differs per machine lives in environment variables.
  Image versions and dependency versions are pinned to the Technology Stack.
- A machine with Docker can start the stack without a separately installed
  database.

**Rationale:** Pinning PostgreSQL 15.19 and Node.js 24.21.0 inside Compose is
what makes the automation reproducible from one repository on any machine.

### V. Small Surface, Justified Complexity

The project stays as small as the current automation requires.

- A new service, library, or background worker needs a written justification
  in the plan's complexity tracking.
- One Express application owns the API. Another backend process needs a
  recorded exception before it is added.
- Vendor payloads are mapped into internal models at the client boundary.
  Rules MUST depend on those models.
- New files follow Folder Structure and Coding Standards.
- Work that does not automate or observe Jira or Confluence stays outside
  this repository.

**Rationale:** Mapping once, and adding processes only with a recorded
reason, keeps the rules stable when Atlassian payloads change.

## Technology Stack

Versions below are the pins. A dependency upgrade changes this section in the
same change.

| Layer | Pin |
| --- | --- |
| Language | JavaScript |
| Frontend UI | React 18.3.1 and React DOM 18.3.1 |
| Frontend build | Vite 8.3.4 |
| Backend runtime | Node.js 24.21.0 |
| Backend HTTP | Express 5.2.1 |
| Database driver | `pg` 8.23.1 |
| Database | PostgreSQL 15.19 (`postgres:15.19`) |
| Containers | Docker Compose at the repository root |

- **Frontend.** React and Vite own UI state and rendering. The page calls
  Express under `/api`.
- **Backend.** Express owns the REST API, automation jobs, and the Jira and
  Confluence clients.
- **Database.** PostgreSQL stores application state: job definitions, run
  history, and copied fields the job recorded. Jira and Confluence remain the
  source for issue and page content.
- **Secrets.** Environment variables. `.env` is gitignored. A variable already
  set in the process environment wins over the same key in a local env file.
- **Tests.** The Node.js test runner covers rules, persistence, and API
  contracts against fixtures and PostgreSQL 15.19. The default suite makes no
  network call to Atlassian.

## Folder Structure

New code MUST land in the tree below. Paths are relative to the repository root.

```text
docker-compose.yml
spec/constitution.md
frontend/
  Dockerfile
  package.json
  src/
    main.jsx                 Vite entry
    pages/                   one screen per file
    components/              shared UI
    api/                     client for this Express API
    styles/                  global CSS
  test/                      frontend tests, mirroring src/
backend/
  Dockerfile
  package.json
  src/
    server.js                Express entry
    routes/                  HTTP handlers, one resource per file
    services/                automation rules
    clients/                 Jira and Confluence HTTP only
    db/
      migrations/            ordered SQL migrations
      queries/               SQL used by services
  test/                      backend tests, mirroring src/
  sample/                    fixtures, no secrets
```

- `frontend/` MUST NOT import from `backend/`.
- `backend/src/routes/` calls services. It does not embed Jira, Confluence, or
  SQL details.
- Jira and Confluence request code lives only in `backend/src/clients/`.
- SQL lives only in `backend/src/db/`.
- Fixtures live in `backend/sample/`. A fixture MUST NOT contain a real token,
  email, or site credential.

## Coding Standards

### Naming

- React components use PascalCase. The file name matches the component:
  `JobList.jsx` exports `JobList`.
- Other JavaScript modules use kebab-case: `jira-client.js`, `sync-job.js`.
- Functions, variables, and function parameters use camelCase.
- Hook functions use a `use` prefix and camelCase: `useJobRun`.
- Module-level constants and environment variables use UPPER_SNAKE_CASE.
- Test files repeat the source base name and add `.test` before the
  extension: `jira-client.test.js`, `JobList.test.jsx`.
- SQL migrations use a zero-padded sequence and snake_case:
  `001_create_job_runs.sql`.
- Tables and columns use snake_case. Table names are plural: `job_runs`.
- HTTP paths start with `/api/` and use kebab-case segments:
  `/api/sync-jobs`.
- CSS class names use kebab-case.

### File organization

- A file has one primary export and one responsibility.
- A page file in `frontend/src/pages/` composes components. Shared widgets go
  in `frontend/src/components/`.
- Calls from the browser to Express go through `frontend/src/api/`.
- A route file maps HTTP to a service function and returns the status code.
  Rule decisions live in `backend/src/services/`.
- A client file maps one Atlassian payload into an internal model and returns
  that model.
- A query file holds the SQL for one table or one job record. Services call
  those query functions.
- A test sits in the matching `test/` tree and imports the module it covers.
- Generated output, `node_modules/`, and local `.env` files stay untracked.

## Development Workflow

- Specs, plans, and tasks MUST be checked against these principles, the folder
  tree, and the naming rules before implementation. A conflict is resolved by
  changing the spec, plan, or tasks.
- A change that alters automation behavior includes tests. When operator-visible
  behavior changes, the repository docs note that change.
- Reviews confirm layer boundaries, secret handling, path and name compliance,
  and that each write to Jira or Confluence is explicit.
- A new dependency states the need that React 18.3.1, Vite 8.3.4, Express
  5.2.1, the Node.js 24.21.0 standard library, and `pg` 8.23.1 cannot meet.
  Accepting it updates the Technology Stack table.
- Local development uses the Compose stack, including `postgres:15.19`.

## Governance

This constitution supersedes informal convention where they conflict.

- **Authority.** Principles I–V, the Technology Stack pins, Folder Structure,
  and Coding Standards are binding. A plan's Constitution Check MUST be
  evaluated against them. A conflict with a MUST is critical. Violations are
  fixed in the spec, plan, or tasks.
- **Amendments.** A change to this document needs a short rationale and a
  version bump under the policy below. The Sync Impact Report at the top of
  this file records the amendment until it is reviewed, then it is removed
  before the file is committed.
- **Versioning policy (SemVer for governance).** MAJOR means a
  backward-incompatible governance change, or a principle removal or
  redefinition. MINOR means a new principle or section, or materially expanded
  guidance. PATCH means clarifications and non-semantic edits.
- **Compliance review.** Every review MUST check these principles, the version
  pins, the folder tree, and the naming rules. Extra complexity or any
  deviation MUST be justified in the change. Unjustified violations block
  acceptance.

**Version**: 1.1.0 | **Ratified**: 2026-10-09 | **Last Amended**: 2026-10-09
