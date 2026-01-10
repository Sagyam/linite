# Repository Structure

## Overview

```
linite/
├── .github/workflows/     # CI/CD pipelines
├── docs/                  # Documentation
├── drizzle/              # Database migrations
├── public/               # Static assets (icons, images)
├── scripts/              # Database & utility scripts
└── src/                  # Source code
    ├── app/              # Next.js App Router
    │   ├── apps/         # Public app pages
    │   ├── admin/        # Protected admin routes
    │   │   ├── (auth)/   # Login page
    │   │   └── (dashboard)/ # Admin dashboard
    │   └── api/          # REST API endpoints
    ├── components/       # React components
    │   ├── ui/           # shadcn/ui primitives
    │   ├── admin/        # Admin-specific components
    │   └── command-output/ # Command display
    ├── db/               # Database schema & client
    ├── hooks/            # Custom React hooks
    ├── lib/              # Utilities & configuration
    ├── providers/        # React context providers
    ├── services/         # Business logic
    │   ├── external-apis/    # API clients
    │   └── refresh-strategies/ # Package refresh
    ├── stores/           # Zustand state management
    ├── test/             # Test configuration
    └── types/            # TypeScript definitions
        ├── entities.ts   # Database entity types
        ├── api.ts        # **NEW:** API request/response types
        └── index.ts      # **NEW:** Barrel export
```

## Key Directories

### `/src/app`
Next.js App Router structure:
- `apps/` - User-facing pages (app selector, details)
- `admin/` - Protected admin pages (login, dashboard, CRUD)
  - `(auth)/` - Authentication routes (login)
  - `(dashboard)/` - Admin dashboard routes (apps, categories, distros, packages, sources, refresh)
- `api/` - REST API routes (public + admin endpoints)

### `/src/services`
Business logic layer:
- `command-generator.ts` - Install command generation
- `package-refresh.ts` - Background refresh workflow
- `external-apis/` - Flathub, AUR, Snapcraft, Repology clients
- `refresh-strategies/` - Source-specific refresh logic

### `/src/components`
React components:
- `ui/` - shadcn/ui primitives (button, card, dialog, etc.)
- `admin/` - Admin UI (forms, tables, sidebar)
- `command-output/` - Command generation and display components
- Root level - Public UI (app grid, cards, filters, etc.)

### `/src/lib`
Utilities and configuration:
- `auth.ts` - BetterAuth server configuration
- `api-utils.ts` - Error handling, basic utilities
- `api-middleware.ts` - **NEW:** Middleware composition for API routes
- `utils.ts` - General utilities (className merger, etc.)
- `validation/` - **NEW:** Request validation
  - `schemas/` - Zod schemas for all entities
  - `middleware.ts` - Validation middleware utilities
  - `index.ts` - Barrel export

## File Naming

- **Pages**: `page.tsx` (Next.js convention)
- **API Routes**: `route.ts` (Next.js convention)
- **Components**: `kebab-case.tsx` (e.g., `app-card.tsx`)
- **Utilities**: `kebab-case.ts` (e.g., `api-utils.ts`)
- **Types**: `entities.ts`, `api.ts`, etc.
- **Tests**: `*.test.ts` or `*.test.tsx` (co-located with source)

## Import Aliases

```typescript
import { db } from '@/db';                    // src/db
import { Button } from '@/components/ui';     // src/components/ui
import { useApps } from '@/hooks';            // src/hooks
import { cn } from '@/lib/utils';             // src/lib/utils
```

## API Route Structure

```
/api/
├── apps/           # GET (list), POST (create)
│   └── [id]/       # GET, PUT, DELETE (single)
├── packages/       # Package CRUD
├── distros/        # Distribution CRUD
├── sources/        # Source CRUD
├── categories/     # Category CRUD
├── distro-sources/ # Distro-source mapping
├── generate/       # Command generation (public)
├── search/         # External API search (admin)
├── refresh/        # Trigger refresh (admin)
├── upload/         # Image uploads (admin)
├── cron/refresh/   # Automated refresh (cron)
└── auth/[...all]/  # BetterAuth endpoints
```

## Documentation Files

All documentation is in the `/docs` folder:

- `PROJECT_OVERVIEW.md` - Architecture overview
- `API_REFERENCE.md` - API endpoint documentation
- `DATABASE_SCHEMA.md` - Database structure
- `ENVIRONMENT.md` - Environment variables
- `INITIAL_DATA.md` - Seed data reference
- `REPOSITORY_STRUCTURE.md` - This file
- `ADVANCED_TABLE_MIGRATION.md` - Database migration guide

The main `README.md` is in the root directory.

---

For detailed architecture, see [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md).
