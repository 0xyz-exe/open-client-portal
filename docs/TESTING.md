# Testing & Verification Guide

Open Client Portal includes an automated test suite verifying unit calculations, CRUD lifecycles, and multi-tenant security isolation.

## 1. Running Backend Tests

Run `pytest` inside `apps/api`:
```bash
cd apps/api
.venv/Scripts/pytest -v
```

### Verified Test Matrix
1. `tests/test_auth.py`
   - Healthcheck endpoint
   - Owner registration and automatic organization setup
   - JWT authentication and session token verification
   - Multi-organization membership retrieval
2. `tests/test_crm_projects.py`
   - Client account creation with primary contacts
   - Project initialization and milestone setup
   - Public client tasks vs internal tasks
   - Kanban task status transitions
   - Deliverable submission and client approval
3. `tests/test_proposals_invoices.py`
   - Itemized decimal arithmetic for subtotal, taxes, and discounts
   - Sequential proposal number generation (`PROP-YYYYMM-XXXX`)
   - Public proposal view and client digital signature recording
   - Sequential invoice numbering (`INV-YYYYMM-XXXX`)
   - Atomic payment reconciliation and balance due calculation
4. `tests/test_multi_tenant_security.py`
   - Cross-organization access prevention (Org B cannot view Org A clients)
   - Client portal resource isolation (Client only sees own projects)
   - Internal task redaction from client views
   - Internal comment redaction from client views
   - Denial of unauthorized staff endpoints to client tokens

## 2. Running Frontend Build Validation
```bash
cd apps/web
pnpm build
```

## 3. Running Screenshot Automation (Playwright)
```bash
python scripts/capture_screenshots.py
```
Screenshots are rendered in `docs/screenshots/`.
