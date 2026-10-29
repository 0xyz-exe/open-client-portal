# Contributing to Open Client Portal

We welcome contributions from the open-source community!

## Development Workflow
1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feature/my-new-feature
   ```
2. Follow strict TypeScript conventions and Pydantic validation rules.
3. Add unit and integration tests under `apps/api/tests`.
4. Ensure tests pass:
   ```bash
   cd apps/api && pytest
   cd ../web && pnpm build
   ```
5. Submit a Pull Request with a clear description of changes.

## Code Standards
- Strict type checking in TypeScript (`strict: true`).
- No hardcoded secrets or production credentials.
- Multi-tenant tenant boundaries must be maintained across all database queries.
