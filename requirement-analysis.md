Project: Support Ticket Management System

Business Context
A small application for managing support tickets. Internal users create, update, comment on, search, and progress tickets through a defined lifecycle.
Core (Mandatory)
Entities
User        (seeded only — no user-management UI required)
- id, name, email, role
 
Ticket
- id, title, description, priority, status,
  assignedTo, createdBy, createdAt, updatedAt
 
Comment
- id, ticketId, message, createdBy, createdAt
Features
Create a ticket.
List tickets.
View ticket details.
Update ticket fields (title, description, priority, assignee).
Change ticket status through the enforced state machine.
Add comments to a ticket.
Keyword search and filter by status.
Persist all data; data survives restart.
Validate required fields; reject invalid input at the backend.
Show meaningful error states in the UI.

Status state machine (the signature judgment piece — kept in Core)
Open         -> In Progress
In Progress  -> Resolved
Resolved     -> Closed
Open         -> Cancelled
In Progress  -> Cancelled

Invalid transitions must be rejected by the backend and handled clearly in the frontend. This is deliberately the hardest part of Core because it is where engineering judgment shows.
Mandatory test tier: integration tests that prove the state-machine rules — valid transitions succeed, invalid transitions are rejected.
Stretch (Optional — evidence toward C1.1)
Third entity or richer data model
Full user CRUD and role management
Authentication, protected routes, API authorization checks
Filter by priority and assignee; sorting; pagination
Additional test tiers: unit tests and edge-case/failure tests
API documentation (Swagger / OpenAPI)
Docker setup, CI workflow
Reusable prompt templates, rules, or specs (persistent project context)


Core Acceptance Criteria
A user can create a ticket via the UI.
A user can view all tickets from the database.
A user can open a ticket detail view.
A user can update ticket fields and reassign.
A user can add comments.
Status changes only through valid transitions; invalid ones are rejected.
Keyword search and status filter work.
Data remains available after restart.
Backend validation prevents invalid records.
No secrets committed to the repo.
State-machine integration tests pass.


Need to sumbit for using cursor tool : 

Submit tool-specific/cursor-workflow/ with project-context.md, spec.md, tasks.md, acceptance-criteria.md, and cursor-rules-or-instructions.md. Show persistent project context, spec-driven development via documents and rules, iteration beyond first output, and traceability from spec to implementation.
