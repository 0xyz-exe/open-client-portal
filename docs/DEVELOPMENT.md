# Local Development Guide

## Prerequisites
- Python 3.11+ (or `uv`)
- Node.js 20+ and `pnpm`
- Git

## 1. Setup Backend (`apps/api`)
```bash
cd apps/api
# Create virtual environment & install dependencies
uv venv
uv pip install -e ".[dev]"

# Seed database with realistic demonstration data
.venv/Scripts/python seed.py

# Start local development server
.venv/Scripts/uvicorn app.main:app --reload --port 8000
```

## 2. Setup Frontend (`apps/web`)
```bash
cd apps/web
# Install dependencies
pnpm install

# Start Vite development server
pnpm dev --port 5176
```

## 3. Pre-Configured Demo Accounts
- **Agency Owner:** `owner@vortexagency.io` / `AgencyOwner2026!`
- **Client Portal:** `client@acmeglobal.com` / `ClientPortal2026!`
