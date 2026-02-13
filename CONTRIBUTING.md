# Contributing to Linite

Thank you for your interest in contributing to Linite! This guide covers everything you need to get started.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Coding Guidelines](#coding-guidelines)
- [Testing](#testing)
- [Common Contributions](#common-contributions)
- [Submitting Changes](#submitting-changes)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) package manager (v1.0+)
- [Turso](https://turso.tech/) database account (or local libSQL)
- [Azure Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/) account (for icon uploads)
- GitHub/Google OAuth credentials (for authentication)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Sagyam/linite.git
cd linite

# Install dependencies
bun install

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials

# Validate environment setup
bun run check-env

# Run database migrations
bun run db:migrate

# Seed initial data
bun run db:seed

# Start development server
bun run dev
```

The app will be available at `http://localhost:3000`.

## Development Setup

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Turso database URL (libsql://...) |
| `DATABASE_AUTH_TOKEN` | Turso auth token |
| `BETTER_AUTH_SECRET` | Auth secret (min 32 chars) |
| `BETTER_AUTH_URL` | Auth URL (default: http://localhost:3000) |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |
| `AZURE_STORAGE_SAS_URL` | Azure Blob Storage SAS URL |
| `SUPERADMIN_EMAIL` | Admin user email |

See [docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md) for detailed setup instructions.

### Database Commands

```bash
bun run db:generate   # Generate migrations from schema changes
bun run db:migrate    # Apply migrations
bun run db:push       # Push schema directly (development)
bun run db:studio     # Open Drizzle Studio
bun run db:wipe       # Clear all data
bun run db:seed       # Populate initial data
```

### Useful Scripts

```bash
bun run dev           # Start development server
bun run build         # Build for production
bun run lint          # Run ESLint
bun run check-env     # Validate environment variables
```

## Project Structure

```
src/
├── app/                 # Next.js App Router pages and API routes
│   ├── api/            # API endpoints
│   ├── admin/          # Admin dashboard pages
│   └── (public)/       # Public pages
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── admin/          # Admin-specific components
│   ├── dashboard/      # Dashboard components
│   └── collection/     # Collection components
├── lib/                 # Utilities and configuration
│   ├── validation/     # Zod schemas
│   └── api-middleware.ts
├── services/            # Business logic
│   └── external-apis/  # External API clients
├── stores/              # Zustand state stores
├── types/               # TypeScript type definitions
└── test/                # Test utilities
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | Drizzle ORM + Turso (libSQL) |
| Auth | BetterAuth |
| UI | shadcn/ui + Tailwind CSS |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Storage | Azure Blob Storage |
| Testing | Vitest + React Testing Library |

## Coding Guidelines

### Use Bun

All commands use `bun` instead of npm/yarn/pnpm:

```bash
bun install           # Install dependencies
bun add <package>     # Add a package
bun run <script>      # Run a script
```

### API Route Patterns

All API routes use standardized middleware from `/src/lib/api-middleware.ts`:

```typescript
// Public endpoint
export const GET = createPublicApiHandler(
  async (request) => {
    return successResponse(data);
  }
);

// Admin endpoint with validation
export const POST = createAuthValidatedApiHandler(
  createAppSchema,
  async (request, validatedData) => {
    return successResponse(newRecord, 201);
  }
);
```

### Key Rules

1. **Validation**: All requests MUST use Zod schemas from `/src/lib/validation`
2. **Types**: Use centralized types from `/src/types`
3. **Database**: Filter at query level, not in-memory
4. **IDs**: Use CUID2 for primary keys
5. **Timestamps**: Include `createdAt` and `updatedAt` on all tables (except junction tables)

### File Organization

- Keep components organized by purpose
- Separate business logic into `/src/services`
- External API clients go in `/src/services/external-apis`
- Keep route handlers thin, delegate to services

## Testing

### Running Tests

```bash
bun test              # Watch mode
bun test:run          # Run once
bun test:all          # Run all tests
bun test:coverage     # With coverage report
bun test:ui           # Visual test runner
```

### Category-Specific Tests

```bash
bun test:components   # UI/Component tests
bun test:logic        # Hooks, lib, services, stores
bun test:hooks        # Hook tests only
bun test:lib          # Utility tests only
bun test:services     # Service tests only
bun test:validation   # Validation schema tests
bun test:apis         # External API tests
```

### Running Specific Tests

```bash
bunx vitest run src/components/app-card.test.tsx
bunx vitest run src/lib/validation/schemas/
bunx vitest run --grep "validation"
```

**Note**: Use `bunx vitest run` for component tests as `bun test` doesn't properly load the DOM environment.

### Writing Tests

Tests are co-located with source files:

```
src/
  components/
    app-card.tsx
    app-card.test.tsx
  lib/
    format.ts
    format.test.ts
```

Follow the AAA pattern (Arrange, Act, Assert):

```typescript
import { describe, it, expect } from 'vitest';

describe('MyFunction', () => {
  it('should do X when Y happens', () => {
    // Arrange
    const input = createMockData();

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toEqual(expected);
  });
});
```

See [docs/TESTING.md](./docs/TESTING.md) for comprehensive testing guidelines.

## Common Contributions

### Adding Applications

1. Use the admin interface at `/admin/apps`
2. Or add via database seed in `src/db/seed.ts`

### Expanding Distribution Support

1. Add the distro to the `distros` table
2. Map available sources in `distroSources`
3. Set appropriate priorities

### Improving Package Selection

The algorithm is in `/src/services/command-generator.ts`:
1. Get user's distro and available sources
2. Find packages for each app
3. Select best package based on priority + preference
4. Group by source and generate commands

### Adding External API Integrations

1. Create client in `/src/services/external-apis/`
2. Add error handling and caching
3. Register the API endpoint in sources table

## Submitting Changes

### Before Submitting

1. Run tests: `bun test:run`
2. Run linter: `bun run lint`
3. Build successfully: `bun run build`

### Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Write/update tests as needed
5. Commit with clear messages
6. Push and open a Pull Request

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add support for Arch Linux
fix: resolve package selection for Flatpak
docs: update API reference
refactor: simplify command generation logic
test: add tests for validation schemas
```

## Documentation

- [API Reference](./docs/API_REFERENCE.md) - Endpoint specifications
- [Database Schema](./docs/DATABASE_SCHEMA.md) - Complete schema definition
- [Environment Variables](./docs/ENVIRONMENT.md) - Configuration reference
- [Testing Guide](./docs/TESTING.md) - Testing best practices
- [Project Overview](./docs/PROJECT_OVERVIEW.md) - Architecture documentation

## Questions?

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
- Be respectful and constructive in discussions

Thank you for contributing!
