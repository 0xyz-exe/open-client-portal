# Open Client Portal Database Schema Specification

Open Client Portal utilizes a normalized relational schema compatible with PostgreSQL 16+ and SQLite 3. Every business resource is bounded by an `organization_id` foreign key for strict tenant isolation.

## Entity Relationship Overview

```
organizations (id, name, slug, logo_url, branding_color, currency, timezone, created_at)
 ├── organization_members (id, organization_id, user_id, role, created_at)
 ├── users (id, email, hashed_password, full_name, global_role, is_active, created_at)
 ├── clients (id, organization_id, name, company, email, phone, status, currency, notes, portal_enabled)
 │    ├── client_contacts (id, client_id, user_id, name, email, phone, job_title, is_primary)
 │    ├── projects (id, organization_id, client_id, name, description, status, priority, budget, progress)
 │    │    ├── milestones (id, project_id, title, due_date, status, order_index)
 │    │    ├── tasks (id, project_id, milestone_id, title, status, priority, is_client_visible)
 │    │    └── deliverables (id, project_id, title, file_url, status, client_feedback, approved_at)
 │    ├── proposals (id, organization_id, client_id, proposal_number, title, subtotal, tax_amount, total_amount, public_token, status)
 │    │    └── proposal_items (id, proposal_id, description, quantity, unit_price, total_price)
 │    ├── invoices (id, organization_id, client_id, project_id, invoice_number, status, total_amount, paid_amount, balance_due)
 │    │    ├── invoice_items (id, invoice_id, description, quantity, unit_price, total_price)
 │    │    └── payments (id, invoice_id, organization_id, amount, payment_method, transaction_reference, paid_at)
 │    └── documents (id, organization_id, client_id, project_id, title, file_name, file_path, category, is_client_visible)
 ├── comments (id, organization_id, project_id, author_id, content, is_internal, created_at)
 ├── notifications (id, organization_id, user_id, title, message, link, is_read, created_at)
 └── audit_logs (id, organization_id, actor_id, actor_name, action, resource_type, resource_id, metadata_json, created_at)
```

## Detailed Tables

### 1. `organizations`
- `id` (INTEGER, PK): Unique organization identifier.
- `name` (VARCHAR 255): Legal or agency trade name.
- `slug` (VARCHAR 100, UNIQUE, INDEX): URL-safe tenant identifier.
- `branding_color` (VARCHAR 50): Primary accent hex code.
- `currency` (VARCHAR 10): Default currency (USD, EUR, GBP, IDR, etc.).
- `timezone` (VARCHAR 50): Default timezone for deadline calculations.

### 2. `users`
- `id` (INTEGER, PK): User identifier.
- `email` (VARCHAR 255, UNIQUE, INDEX): Primary authentication login.
- `hashed_password` (VARCHAR 255): Secure bcrypt hash.
- `full_name` (VARCHAR 255): Display name.
- `global_role` (VARCHAR 50): `owner`, `admin`, `manager`, `member`, `client`.
- `is_active` (BOOLEAN): Deactivation flag.

### 3. `clients` & `client_contacts`
- Enforces distinction between the legal entity (`clients`) and authorized client staff representatives (`client_contacts`).
- `portal_enabled` controls whether contact users can authenticate to `/portal`.
- Foreign key `user_id` on `client_contacts` maps the client contact to a login account.

### 4. `projects`, `tasks`, and `deliverables`
- `tasks.is_client_visible` (BOOLEAN): Strict server-side filter preventing internal engineering tickets or security audits from leaking to client views.
- `deliverables.status` (`pending_review`, `approved`, `rejected`): Formal client sign-off state.
- `deliverables.client_feedback` (TEXT): Audit trail of client remarks upon approval or change request.

### 5. `proposals` & `proposal_items`
- Decimal precision arithmetic (`Numeric(12, 2)`): Eliminates floating-point rounding errors.
- `public_token` (VARCHAR 100, UNIQUE, INDEX): Secret token for authenticated/public web review and electronic signature.
- `accepted_at`, `accepted_by_name`, `signature_data`: Immutable execution record.

### 6. `invoices` & `payments`
- Concurrency-safe sequential invoice numbering (`INV-YYYYMM-XXXX`).
- `balance_due`: Automatically calculated as `total_amount - paid_amount`.
- Atomic database updates upon payment recording.
