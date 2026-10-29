# Open Client Portal REST API Reference

The backend exposes an OpenAPI 3.1-compliant REST API under `/api/v1`. Interactive documentation is available at `/docs` (Swagger UI) and `/redoc` (ReDoc).

## Common Headers
- `Authorization: Bearer <jwt_access_token>`
- `X-Organization-Id: <org_id>` (Required for agency staff belonging to multiple organizations)

## Endpoints Summary

### Authentication & Organizations
- `POST /api/v1/auth/register` — Register agency owner and initialize organization
- `POST /api/v1/auth/login` — Login user (returns JWT access token and user role)
- `GET /api/v1/auth/me` — Retrieve active authenticated user profile
- `GET /api/v1/auth/organizations` — List organizations accessible to user
- `POST /api/v1/auth/organizations` — Create additional organization workspace
- `GET /api/v1/auth/team` — List agency team members
- `POST /api/v1/auth/team/invite` — Invite new team member

### Clients CRM
- `GET /api/v1/clients` — Search & list clients
- `POST /api/v1/clients` — Create client with contacts
- `GET /api/v1/clients/{id}` — Get client details
- `PUT /api/v1/clients/{id}` — Update client metadata
- `DELETE /api/v1/clients/{id}` — Archive client
- `POST /api/v1/clients/{id}/invite-portal` — Generate client portal access credentials

### Projects & Kanban
- `GET /api/v1/projects` — List projects (strictly filtered by client if authenticated as client)
- `POST /api/v1/projects` — Create project
- `GET /api/v1/projects/{id}` — Get project with milestones, tasks, deliverables
- `PUT /api/v1/projects/{id}` — Update project status/progress
- `POST /api/v1/projects/{id}/milestones` — Create milestone
- `POST /api/v1/projects/{id}/tasks` — Create task (client-visible or internal)
- `PUT /api/v1/projects/tasks/{id}` — Update task status (kanban transition)
- `POST /api/v1/projects/{id}/deliverables` — Submit deliverable for client review
- `POST /api/v1/projects/deliverables/{id}/review` — Approve or reject deliverable with client feedback

### Proposals & Contracts
- `GET /api/v1/proposals` — List proposals
- `POST /api/v1/proposals` — Create itemized proposal with subtotal/tax/discount
- `GET /api/v1/proposals/{id}` — Get proposal details
- `POST /api/v1/proposals/{id}/send` — Mark proposal as sent
- `GET /api/v1/proposals/public/{token}` — Public client proposal review view
- `POST /api/v1/proposals/public/{token}/accept` — Execute digital signature and acceptance

### Invoices & Billing
- `GET /api/v1/invoices` — List invoices
- `POST /api/v1/invoices` — Generate sequential invoice
- `GET /api/v1/invoices/{id}` — Get invoice details, items, payments
- `POST /api/v1/invoices/{id}/payments` — Record payment and reconcile balance due
- `POST /api/v1/invoices/{id}/send` — Mark invoice as sent

### Documents & File Management
- `GET /api/v1/documents` — List documents (filters internal files if client)
- `POST /api/v1/documents` — Multipart file upload with category and visibility flags
- `GET /api/v1/documents/{id}/download` — Authorized file download stream

### Dashboard & Analytics
- `GET /api/v1/dashboard/stats` — Agency metrics, collected revenue, receivables, recent logs
- `GET /api/v1/dashboard/client-portal` — Scoped client portal dashboard metrics
- `GET /api/v1/dashboard/audit-logs` — Immutable audit log feed
- `GET /api/v1/dashboard/notifications` — In-app notifications
