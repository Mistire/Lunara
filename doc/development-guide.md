# Lunara — Development Guide

## Overview

This guide covers everything needed to run Lunara locally, configure environment variables, understand the project structure, and follow the team's development workflow.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Environment Setup](#environment-setup)
  - [Backend Environment Variables](#backend-environment-variables)
  - [Frontend Environment Variables](#frontend-environment-variables)
- [Database Setup](#database-setup)
  - [Option A: Docker (Local PostgreSQL)](#option-a-docker-local-postgresql)
  - [Option B: Supabase (Remote)](#option-b-supabase-remote)
- [Backend Setup (NestJS)](#backend-setup-nestjs)
- [Frontend Setup (TanStack Start)](#frontend-setup-tanstack-start)
- [ICD-10 Data Seeding](#icd-10-data-seeding)
- [Running the Full Stack](#running-the-full-stack)
- [Available Scripts](#available-scripts)
- [Branching Strategy](#branching-strategy)
- [Commit Conventions](#commit-conventions)
- [Code Style & Linting](#code-style--linting)

---

## Prerequisites

Ensure the following tools are installed before beginning:

| Tool | Version | Install |
|---|---|---|
| **Node.js** | `>= 20.x` | [nodejs.org](https://nodejs.org) |
| **npm** | `>= 10.x` | Bundled with Node.js |
| **Docker** | Latest | [docker.com](https://docker.com) |
| **Docker Compose** | Latest | Bundled with Docker Desktop |
| **Git** | Latest | [git-scm.com](https://git-scm.com) |

Optional but recommended:
- **pgAdmin** or **TablePlus** — GUI for PostgreSQL inspection
- **Postman** or **Bruno** — API testing

---

## Project Structure

```
lunara/
├── backend/                     # NestJS REST API + WebSocket
│   ├── src/
│   │   ├── auth/                # JWT auth, guards, decorators
│   │   ├── users/               # Staff account management
│   │   ├── patients/            # Patient registration and profiles
│   │   ├── appointments/        # Appointment booking and queue
│   │   ├── consultations/       # EHR, SOAP notes, diagnoses
│   │   ├── prescriptions/       # Digital prescriptions
│   │   ├── lab-orders/          # Lab order dispatch
│   │   ├── lab-results/         # Lab result entry
│   │   ├── invoices/            # Billing and invoices
│   │   ├── payments/            # Payment processing
│   │   ├── analytics/           # Reports and dashboards
│   │   ├── icd10/               # ICD-10 code search
│   │   ├── pdf/                 # Puppeteer PDF generation
│   │   ├── websocket/           # WebSocket gateway (queue + lab events)
│   │   ├── database/            # Drizzle ORM schema + migrations
│   │   │   ├── schema/          # Drizzle table definitions
│   │   │   └── migrations/      # Generated migration files
│   │   └── common/              # Shared utilities, interceptors, pipes
│   ├── .env.example
│   ├── drizzle.config.ts
│   ├── docker-compose.yml
│   └── package.json
│
├── frontend/                    # TanStack Start PWA
│   ├── app/
│   │   ├── routes/              # File-based routing (TanStack Start)
│   │   │   ├── _auth/           # Auth layout (login, register)
│   │   │   ├── _dashboard/      # Main app layout
│   │   │   │   ├── patients/
│   │   │   │   ├── appointments/
│   │   │   │   ├── consultations/
│   │   │   │   ├── lab-orders/
│   │   │   │   ├── billing/
│   │   │   │   └── analytics/
│   │   │   └── index.tsx        # Root redirect
│   │   ├── components/          # Shared UI components
│   │   │   ├── ui/              # shadcn/ui primitives
│   │   │   └── domain/          # Feature-specific components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API client functions (typed)
│   │   ├── stores/              # Client-side state (Zustand or TanStack Query)
│   │   ├── db/                  # Dexie.js IndexedDB setup
│   │   ├── workers/             # Service worker (Workbox)
│   │   └── lib/                 # Utilities, formatters, constants
│   ├── public/
│   │   ├── icons/               # PWA icons (192, 512, maskable)
│   │   └── manifest.webmanifest
│   ├── .env.example
│   └── package.json
│
├── doc/                         # Project documentation
│   ├── project-brief.md
│   ├── database-schema.md
│   ├── api-design.md
│   ├── user-roles-permissions.md
│   ├── pwa-architecture.md
│   └── development-guide.md     # ← This file
│
└── README.md
```

---

## Environment Setup

### Backend Environment Variables

Create `backend/.env` by copying `backend/.env.example`:

```bash
cp backend/.env.example backend/.env
```

**`backend/.env.example`:**
```env
# ─── Application ────────────────────────────────────
NODE_ENV=development
PORT=3001

# ─── Database ───────────────────────────────────────
# For local Docker: postgresql://postgres:password@localhost:5432/lunara
# For Supabase: from Project Settings > Database > Connection string (URI)
DATABASE_URL=postgresql://postgres:password@localhost:5432/lunara

# ─── JWT Authentication ─────────────────────────────
JWT_SECRET=replace_with_a_strong_random_secret_min_32_chars
JWT_REFRESH_SECRET=replace_with_a_different_strong_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ─── CORS ───────────────────────────────────────────
FRONTEND_URL=http://localhost:3000

# ─── Puppeteer (PDF Generation) ─────────────────────
PUPPETEER_EXECUTABLE_PATH=   # Leave empty for auto-detection in development
                              # Set on Render: /usr/bin/google-chrome-stable
```

**Generating secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Frontend Environment Variables

Create `frontend/.env` by copying `frontend/.env.example`:

```bash
cp frontend/.env.example frontend/.env
```

**`frontend/.env.example`:**
```env
# ─── API ────────────────────────────────────────────
VITE_API_URL=http://localhost:3001/api/v1
VITE_WS_URL=ws://localhost:3001
```

---

## Database Setup

### Option A: Docker (Local PostgreSQL)

This is the recommended approach for local development. A `docker-compose.yml` is provided in the `backend/` directory.

**`backend/docker-compose.yml`:**
```yaml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    container_name: lunara_postgres
    environment:
      POSTGRES_DB: lunara
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - lunara_pgdata:/var/lib/postgresql/data

volumes:
  lunara_pgdata:
```

**Start the database:**
```bash
cd backend
docker compose up -d
```

**Stop the database:**
```bash
docker compose down
```

**Reset the database (WARNING: deletes all data):**
```bash
docker compose down -v
docker compose up -d
```

---

### Option B: Supabase (Remote)

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Project Settings → Database → Connection string**
3. Copy the **URI** connection string
4. Paste it into `backend/.env` as `DATABASE_URL`

> **Tip:** Use the **Transaction Pooler** connection string (port 6543) for production. Use the **Direct Connection** (port 5432) for development and migrations.

---

## Backend Setup (NestJS)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Seed initial data (admin user, clinic)
npm run db:seed

# Seed ICD-10 codes (separate step — see ICD-10 section)
npm run db:seed:icd10

# Start development server (hot reload)
npm run start:dev
```

The NestJS API will be available at: `http://localhost:3001`  
API documentation (Swagger): `http://localhost:3001/api/docs`

### Drizzle ORM Commands

```bash
# Generate migration from schema changes
npm run db:generate

# Apply pending migrations
npm run db:migrate

# Open Drizzle Studio (schema explorer)
npm run db:studio

# Push schema directly (development only, bypasses migrations)
npm run db:push
```

---

## Frontend Setup (TanStack Start)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at: `http://localhost:3000`

---

## ICD-10 Data Seeding

Lunara uses a local PostgreSQL table to store ICD-10 codes for offline autocomplete functionality. The WHO ICD-10 dataset is seeded into the `icd10_codes` table.

### Download the ICD-10 Dataset

The WHO provides ICD-10 codes as a free CSV/JSON download. A preprocessed version is included in the repository at `backend/src/database/seeds/icd10_data.json`.

> **Source:** WHO ICD-10 Version 2019 (approximately 14,400 codes)

### Run the Seeder

```bash
cd backend
npm run db:seed:icd10
```

This command:
1. Reads `backend/src/database/seeds/icd10_data.json`
2. Inserts all codes into the `icd10_codes` table (idempotent — skips duplicates)
3. Triggers the PostgreSQL `tsvector` update for all rows, enabling full-text search

**Expected output:**
```
[ICD10 Seeder] Seeding 14,400 ICD-10 codes...
[ICD10 Seeder] Inserted: 14,400 codes
[ICD10 Seeder] Full-text search index refreshed.
[ICD10 Seeder] Done.
```

---

## Running the Full Stack

Once both backend and frontend are configured:

```bash
# Terminal 1 — Database
cd backend && docker compose up -d

# Terminal 2 — Backend
cd backend && npm run start:dev

# Terminal 3 — Frontend
cd frontend && npm run dev
```

**URLs:**

| Service | URL |
|---|---|
| Frontend (PWA) | `http://localhost:3000` |
| Backend API | `http://localhost:3001/api/v1` |
| Swagger Docs | `http://localhost:3001/api/docs` |
| Drizzle Studio | `http://localhost:4983` (run `npm run db:studio`) |
| PostgreSQL | `localhost:5432` (user: `postgres`, password: `password`) |

**Default admin credentials (after seed):**
```
Email:    admin@lunara.et
Password: Admin@lunara1
```

> ⚠️ Change the admin password immediately after first login in any non-local environment.

---

## Available Scripts

### Backend (`backend/package.json`)

| Script | Description |
|---|---|
| `npm run start:dev` | Start development server with hot reload |
| `npm run start:prod` | Start production server |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run test` | Run unit tests (Jest) |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run db:generate` | Generate Drizzle migration from schema |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:push` | Push schema without migration (dev only) |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Seed initial clinic and admin user |
| `npm run db:seed:icd10` | Seed ICD-10 codes |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |

### Frontend (`frontend/package.json`)

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build production bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |
| `npm run type-check` | Run TypeScript type checking |

---

## Branching Strategy

```
main          ← Production-ready code only (protected)
  └── develop ← Integration branch — all features merge here
        ├── feature/patient-registration
        ├── feature/appointment-queue
        ├── feature/ehr-consultation
        ├── feature/icd10-search
        ├── feature/prescriptions
        ├── feature/lab-workflow
        ├── feature/billing
        ├── feature/pwa-offline
        └── fix/queue-number-race-condition
```

### Branch Naming Rules

| Prefix | Usage | Example |
|---|---|---|
| `feature/` | New feature development | `feature/soap-notes` |
| `fix/` | Bug fixes | `fix/jwt-refresh-loop` |
| `hotfix/` | Critical production fix | `hotfix/invoice-total-calc` |
| `docs/` | Documentation only | `docs/update-api-design` |
| `refactor/` | Code refactoring | `refactor/patient-service` |
| `chore/` | Tooling, CI, dependencies | `chore/update-drizzle` |

### Pull Request Rules

- All PRs target `develop` (never `main` directly)
- PR title must follow commit convention format
- At least 1 reviewer approval required
- All CI checks must pass before merge
- `main` is only merged from `develop` for versioned releases

---

## Commit Conventions

Lunara follows the **Conventional Commits** specification.

### Format

```
type(scope): description

[optional body]

[optional footer]
```

### Types

| Type | When to Use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes only |
| `style` | Code formatting (no logic change) |
| `refactor` | Code restructuring without feature change |
| `test` | Adding or updating tests |
| `chore` | Build tools, dependencies, CI |
| `perf` | Performance improvements |

### Scopes

Use module names as scopes:

```
auth, users, patients, appointments, consultations, soap-notes,
icd10, prescriptions, lab-orders, lab-results, invoices, payments,
analytics, pwa, db, ci
```

### Examples

```
feat(patients): add MRN auto-generation on registration
fix(appointments): resolve queue number duplication for concurrent walk-ins
docs(api-design): add WebSocket event table
refactor(auth): extract token rotation logic into AuthService
chore(db): upgrade Drizzle ORM to 0.30.0
test(consultations): add unit tests for SOAP notes upsert
```

---

## Code Style & Linting

### TypeScript

- **Strict mode** enabled (`"strict": true` in `tsconfig.json`)
- No `any` types without justification
- All exported functions must have explicit return types

### ESLint

Both backend and frontend use ESLint with:
- `@typescript-eslint` plugin
- `import` ordering rules

```bash
# Check lint errors
npm run lint

# Auto-fix lint errors
npm run lint -- --fix
```

### Prettier

```bash
# Format all files
npm run format
```

**`.prettierrc`:**
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

### Import Order Convention

```typescript
// 1. Node built-ins
import path from 'path';

// 2. External packages
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

// 3. Internal modules (absolute imports)
import { DatabaseService } from '@/database/database.service';
import { patients } from '@/database/schema';

// 4. Relative imports
import { CreatePatientDto } from './dto/create-patient.dto';
```
