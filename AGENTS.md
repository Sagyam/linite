# Linite - Agent Development Guide

This file contains essential information for agentic coding assistants working on the Linite codebase.

## Build & Development Commands

**Package Manager**: Always use `bun` (never npm/yarn/pnpm)

```bash
# Development
bun run dev                    # Start development server
bun install                   # Install dependencies
bun add <package>             # Add new dependency

# Build & Production
bun run build                 # Build for production
bun run start                 # Start production server

# Code Quality
bun run lint                  # Run ESLint
bun run check-env             # Validate environment variables

# Testing
bun test                      # Run tests in watch mode
bun test:run                  # Run tests once
bun test:coverage             # Run with coverage report
bun test:ui                   # Run with Vitest UI

# Single Test Commands
bun test src/components/app-card.test.tsx    # Run specific test file
bun test --run src/lib/api-utils.test.ts     # Run specific test once
bun test src/lib/validation/                 # Run all tests in directory
bun test:components                          # Run component tests only
bun test:services                            # Run service tests only
bun test:validation                          # Run validation tests only

# Database
bun run db:generate          # Generate migrations
bun run db:migrate           # Run migrations
bun run db:push              # Push schema changes
bun run db:studio            # Open Drizzle Studio
bun run db:seed              # Seed database
bun run db:wipe              # Wipe all data
```

## Code Style & Conventions

### Import Organization
```typescript
// 1. React/Next.js imports
import { NextRequest } from 'next/server';
import { memo } from 'react';

// 2. Third-party libraries
import { z } from 'zod';
import { asc, eq } from 'drizzle-orm';

// 3. Internal imports (use @ alias)
import { successResponse } from '@/lib/api-utils';
import { AppCard } from '@/components/app-card';
import type { App } from '@/types/entities';
```

### TypeScript & Types
- Use strict TypeScript configuration
- Import types with `type` keyword: `import type { App } from '@/types'`
- Use centralized types from `/src/types` directory
- All API routes must use Zod validation schemas from `/src/lib/validation`

### Component Patterns
```typescript
// Use memo for performance optimization
export const AppCard = memo(function AppCard({ app }: AppCardProps) {
  // Component logic
});

// Use 'use client' directive for client components
'use client';

// Props interfaces
interface AppCardProps {
  app: App;
  layout?: 'compact' | 'detailed';
}
```

### API Route Structure
All API routes MUST use standardized middleware from `/src/lib/api-middleware.ts`:

```typescript
// Public endpoint
export const GET = createPublicApiHandler(
  async (request) => {
    return successResponse(data);
  }
);

// Admin endpoint with validation
export const POST = createAuthValidatedApiHandler(
  createAppSchema,  // Zod schema
  async (request, validatedData) => {
    return successResponse(newRecord, 201);
  }
);
```

### Database Patterns
- Use Drizzle ORM with SQLite dialect
- All tables use CUID2 for primary keys
- Include timestamps (createdAt, updatedAt) except `distroSources`
- Filter at query level, never in-memory
- Use repositories for data access (`/src/repositories`)

### Error Handling
```typescript
// Use centralized error responses
return errorResponse('Not found', 404);

// Validate with Zod schemas
const validatedData = createAppSchema.parse(body);

// Handle async errors properly
try {
  const result = await operation();
  return successResponse(result);
} catch (error) {
  return errorResponse('Operation failed', 500);
}
```

### Naming Conventions
- **Files**: kebab-case (`app-card.tsx`, `api-utils.ts`)
- **Components**: PascalCase (`AppCard`, `CommandDialog`)
- **Functions/Variables**: camelCase (`getUserData`, `selectedApps`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`, `API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`ApiResponse`, `UserProps`)

### UI Components
- Use shadcn/ui components from `/src/components/ui`
- Follow existing component patterns
- Use `cn()` utility for conditional classes
- Implement proper responsive design with Tailwind

### State Management
- Use Zustand for global state (`/src/stores`)
- Use React Query for server state (`/src/hooks`)
- Keep components stateless when possible
- Use proper loading and error states

### File Organization
```
src/
├── app/                 # Next.js app router
├── components/          # React components
│   ├── ui/            # shadcn/ui components
│   └── admin/         # Admin-specific components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and helpers
│   └── validation/    # Zod schemas
├── services/           # Business logic
├── repositories/       # Data access layer
├── stores/            # Zustand stores
└── types/             # TypeScript definitions
```

### Testing Guidelines
- Co-locate tests with source files (`*.test.ts` or `*.test.tsx`)
- Use Vitest with happy-dom environment
- Test utilities in `/src/test/component-utils.tsx`
- Aim for high test coverage (239 tests currently passing)
- Use proper mocking for external dependencies

### Environment & Configuration
- All environment variables validated with Zod on startup
- Use `.env.example` for required variables
- Run `bun run check-env` to validate setup
- Never commit secrets to repository

### External APIs
- Clients in `/src/services/external-apis/`
- Integrate with Flathub, Snapcraft, Repology, AUR
- Add proper error handling and caching
- Use Azure Blob Storage for file uploads

## Key Architecture Rules

1. **Use Bun exclusively** for all package management
2. **Follow API middleware patterns** - no direct route handlers
3. **Validate all requests** with Zod schemas
4. **Use centralized types** from `/src/types`
5. **Filter at database level**, never in-memory
6. **Keep route handlers thin**, delegate to services
7. **Use standardized error responses** from `/src/lib/api-utils`
8. **Follow existing component patterns** and naming conventions
9. **Write tests for all new features** using existing patterns
10. **Update documentation** in `/docs` when making architectural changes

## Quick Reference

- **Database Schema**: `/docs/DATABASE_SCHEMA.md`
- **API Reference**: `/docs/API_REFERENCE.md`
- **Project Structure**: `/docs/REPOSITORY_STRUCTURE.md`
- **Environment Setup**: `/docs/ENVIRONMENT.md`

Always run `bun run lint` and `bun test:run` before completing tasks to ensure code quality.