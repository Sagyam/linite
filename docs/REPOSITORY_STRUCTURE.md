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
    │   ├── (public)/     # Public routes
    │   ├── admin/        # Protected admin routes
    │   └── api/          # REST API endpoints
    ├── components/       # React components
    │   ├── ui/           # shadcn/ui primitives
    │   └── admin/        # Admin-specific components
    ├── db/               # Database schema & client
    ├── hooks/            # Custom React hooks
    ├── lib/              # Utilities & configuration
    ├── services/         # Business logic
    │   ├── external-apis/    # API clients
    │   └── refresh-strategies/ # Package refresh
    ├── stores/           # Zustand state management
    ├── test/             # Test configuration
    └── types/            # TypeScript definitions
```

## Key Directories

### `/src/app`
Next.js App Router structure:
- `(public)/` - User-facing pages (app selector, details)
- `admin/` - Protected admin pages (login, dashboard, CRUD)
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
- Root level - Public UI (app grid, command output, etc.)

### `/src/lib`
Utilities and configuration:
- `auth.ts` - BetterAuth server configuration
- `api-utils.ts` - Rate limiting, error handling, middleware
- `utils.ts` - General utilities (className merger, etc.)

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

- `README.md` - Getting started guide
- `PROJECT_OVERVIEW.md` - Architecture overview
- `API_REFERENCE.md` - API endpoint documentation
- `DATABASE_SCHEMA.md` - Database structure
- `ENVIRONMENT.md` - Environment variables
- `INITIAL_DATA.md` - Seed data reference
- `TESTING.md` - Test documentation
- `SEO.md` - SEO configuration

---

For detailed architecture, see [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md).
