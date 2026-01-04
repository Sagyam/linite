# Linite - Development Guide

## Project Overview

Linite is a Ninite-style bulk package installer for Linux distributions. Users select apps, choose their distro, and get a single install command.

**Documentation**: See `README.md` and `/docs` folder for detailed documentation

## Key Technologies

- **Framework**: Next.js 14+ (App Router)
- **Database**: Drizzle ORM + Turso (libSQL)
- **Auth**: BetterAuth
- **UI**: shadcn/ui + Tailwind CSS
- **State**: Zustand
- **Storage**: Azure Blob Storage (for app icon uploads)
- **Package Manager**: bun

## Essential Rules

### 1. Use Bun
All commands use `bun` instead of npm/yarn/pnpm:
```bash
bun install
bun run dev
bun add <package>
```

### 2. Database Schema
The complete Drizzle schema is defined in `/docs/DATABASE_SCHEMA.md`. Follow it exactly. All tables use:
- CUID2 for primary keys
- SQLite dialect
- Timestamps (createdAt, updatedAt) - except `distroSources` which doesn't need them

### 3. API Route Structure & Patterns

**Standardized Middleware (2026-01):**
All new API routes MUST use the standardized middleware patterns from `/src/lib/api-middleware.ts`:

```typescript
// Public endpoint with rate limiting
export const GET = createPublicApiHandler(
  async (request) => {
    // Your handler logic
    return successResponse(data);
  },
  publicApiLimiter  // Optional rate limiter
);

// Admin endpoint (requires auth)
export const POST = createAuthValidatedApiHandler(
  createAppSchema,  // Zod validation schema
  async (request, validatedData) => {
    // Your handler logic with validated data
    return successResponse(newRecord, 201);
  }
);
```

**Rules:**
- Use `createPublicApiHandler` for public endpoints
- Use `createAuthApiHandler` for admin endpoints without body validation
- Use `createAuthValidatedApiHandler` for admin endpoints with body validation
- ALL requests MUST be validated using Zod schemas from `/src/lib/validation`
- Use centralized types from `/src/types`
- Database filtering MUST happen at query level, NOT in-memory
- Rate limiting: All public endpoints use Upstash Redis (see `/docs/API_REFERENCE.md`)

**Routes:**
- Public routes: `/api/apps`, `/api/distros`, `/api/sources`, `/api/categories`, `/api/generate`
- Admin routes: All CRUD operations + `/api/packages`, `/api/distro-sources`, `/api/refresh`, `/api/upload`

### 4. File Organization
Follow the structure in `/docs/REPOSITORY_STRUCTURE.md`:
- Keep components organized by purpose (ui/, public components, admin/)
- Separate business logic into `/src/services`
- External API clients in `/src/services/external-apis`
- Keep route handlers thin, delegate to services

### 5. Command Generation Logic
See `/docs/API_REFERENCE.md` for the `/api/generate` endpoint spec. The algorithm:
1. Get user's distro and available sources
2. For each selected app, find available packages
3. Select best package per app based on source priority + user preference
4. Group packages by source
5. Generate install commands + setup commands
6. Return warnings for unavailable packages

### 6. External APIs
Integrate with Flathub, Snapcraft, Repology, and AUR. Clients go in `/src/services/external-apis/`. Add error handling and caching.

### 7. Documentation Standards
- Keep all documentation in the `/docs` folder
- Never create markdown files in the root directory (except README.md)
- Update docs when making significant changes to architecture or APIs

## Quick Reference

**Start development:**
```bash
bun run dev
```

**Database commands:**
```bash
bun run db:generate   # Generate migrations
bun run db:migrate    # Run migrations
bun run db:push       # Push schema changes
bun run db:studio     # Open Drizzle Studio
bun run db:wipe       # Wipe all data from database
bun run db:seed       # Seed database with initial data
```

**Environment variables:**
```bash
bun run check-env     # Validate environment setup
```
See `.env.example` for required variables. All env vars are validated using Zod on startup.

## Documentation

- **Getting Started**: `README.md`
- **Architecture**: `/docs/PROJECT_OVERVIEW.md`
- **API Docs**: `/docs/API_REFERENCE.md`
- **Database**: `/docs/DATABASE_SCHEMA.md`
- **Environment**: `/docs/ENVIRONMENT.md`
- **Initial Data**: `/docs/INITIAL_DATA.md`

## Testing

```bash
bun test                  # Watch mode
bun test:run              # Run once
bun test:coverage         # With coverage
```

**239 tests passing** - Tests are co-located with source files (`*.test.ts` or `*.test.tsx`)
