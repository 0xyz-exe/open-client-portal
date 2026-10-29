# Changelog

All notable changes to Open Client Portal will be documented in this file.

## [1.0.0] - 2026-10-30

### Initial Open-Source Release
- **Agency CRM & Client Accounts:** Centralized contact directory, billing addresses, and 1-click portal credential generator.
- **Project Tracking & Milestones:** Project progress bar, deliverables checklist, and interactive Kanban boards.
- **Client Sign-Off & Approvals:** Formal deliverable approval workflows with feedback remarks and immutable timestamps.
- **Itemized Proposals & Contracts:** Proposal generator with tax/discount calculation and public digital signature acceptance.
- **Invoicing & Balance Reconciliation:** Sequential numbering (`INV-YYYYMM-XXXX`), partial payments, and overdue tracking.
- **Secure File Storage:** Private document repository with granular client visibility policies.
- **Dedicated Client Portal:** Scoped client interface (`/portal`) strictly isolating client deliverables and invoices.
- **Multi-Tenant Isolation:** Complete tenant separation across all database operations.
- **Docker Compose:** Production deployment stack with PostgreSQL 16 and Nginx edge proxy.
