# Open Client Portal Architecture Specification

## 1. System Overview

Open Client Portal is architected as a high-performance, self-hosted web application tailored for freelancers, creative agencies, and software development studios. The platform decouples agency operations from external client visibility while maintaining a single source of truth across projects, deliverables, itemized proposals, invoices, and file assets.

```
                    ┌────────────────────────────────────────────────────────┐
                    │                   Web Browser / User                  │
                    └───────────────────────────┬────────────────────────────┘
                                                │
                                    HTTP / REST / Static
                                                │
                                                ▼
                    ┌────────────────────────────────────────────────────────┐
                    │               Reverse Proxy / Nginx Edge               │
                    │               (Port 80 / SSL Termination)              │
                    └───────────┬────────────────────────────────┬───────────┘
                                │                                │
                        /api/*  ▼                       /*       ▼
            ┌───────────────────────────────┐        ┌───────────────────────┐
            │       FastAPI API Engine      │        │ React 19 SPA (Vite)   │
            │     (Python 3.12+ / Pydantic) │        │  Tailwind CSS v4      │
            └───────────────┬───────────────┘        └───────────────────────┘
                            │
               SQLAlchemy 2.0 ORM / Connection Pool
                            │
                            ▼
            ┌───────────────────────────────┐        ┌───────────────────────┐
            │   PostgreSQL 16 / SQLite 3    │        │ Persistent Uploads    │
            │   Relational Multi-Tenant DB  │        │ (Local FS / S3 Bucket)│
            └───────────────────────────────┘        └───────────────────────┘
```

## 2. Core Subsystems

### 2.1 Backend Engine (`apps/api`)
- **Framework:** FastAPI with Python 3.12+
- **Validation & Serialization:** Pydantic v2 schemas
- **Data Access:** SQLAlchemy 2.0 ORM with declarative models and indexed foreign keys
- **Multi-Tenant Security:** Organization and Client context dependencies injected on every protected route.
- **Audit Subsystem:** Append-only `AuditLog` records capturing actor identity, action type, resource IDs, and structured JSON metadata.

### 2.2 Frontend Application (`apps/web`)
- **UI Framework:** React 19 + TypeScript in strict mode
- **Bundler:** Vite 6
- **Design System:** Tailwind CSS v4 with dark-mode aesthetic
- **Icons:** Lucide React
- **Data Visualization:** Recharts for cash flow, pipeline analytics, and project progress metrics

### 2.3 Two Distinct User Experiences
1. **Agency Workspace (`/app/*`):** Full multi-client CRM, project tracking, milestone kanban, deliverable submission, itemized proposal generator, and invoice reconciliation.
2. **Dedicated Client Portal (`/portal/*`):** Isolated branded client view strictly scoped to the authenticated client's authorized projects, deliverables awaiting review, client-visible tasks, and outstanding invoices.
