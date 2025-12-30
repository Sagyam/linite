# Linite Documentation

Complete documentation for the Linite project - a Ninite-style bulk package installer for Linux distributions.

## Quick Links

- [Project Overview](./docs/PROJECT_OVERVIEW.md) - Architecture and tech stack
- [API Reference](./docs/API_REFERENCE.md) - REST API endpoints
- [Database Schema](./docs/DATABASE_SCHEMA.md) - Database structure
- [Repository Structure](./docs/REPOSITORY_STRUCTURE.md) - Code organization
- [Environment Setup](./docs/ENVIRONMENT.md) - Configuration guide
- [Initial Data](./docs/INITIAL_DATA.md) - Seed data reference

## Getting Started

### Prerequisites
- Bun 1.0+
- Node.js 20+
- Turso account (or local SQLite)

### Installation

```bash
# Install dependencies
bun install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your values
# DATABASE_URL, DATABASE_AUTH_TOKEN, BETTER_AUTH_SECRET, etc.

# Run database migrations
bun run db:push

# Seed the database
bun run db:seed

# Start development server
bun run dev
```

Visit `http://localhost:3000` to see the app.

## Project Structure

```
linite/
├── src/
│   ├── app/              # Next.js App Router (pages & API routes)
│   ├── components/       # React components
│   ├── db/              # Database schema & client
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities & helpers
│   ├── services/        # Business logic & external APIs
│   ├── stores/          # Zustand state management
│   ├── test/            # Test configuration
│   └── types/           # TypeScript type definitions
├── docs/                # Documentation
├── public/              # Static assets
└── scripts/             # Database & utility scripts
```

## Key Features

### User-Facing
- ✅ Browse curated app catalog by category
- ✅ Select multiple apps for installation
- ✅ Choose your Linux distribution
- ✅ Optional source preference (Flatpak, Snap, APT, etc.)
- ✅ Generate single install command
- ✅ Copy commands with one click

### Admin Features
- ✅ Manage apps, packages, categories
- ✅ Manage distributions and sources
- ✅ Configure distro-source mappings
- ✅ Search external APIs (Flathub, Snap, AUR, Repology)
- ✅ Trigger package metadata refresh
- ✅ View refresh job logs

### Technical
- ✅ Rate-limited public APIs
- ✅ Protected admin endpoints
- ✅ Automated package refresh (cron)
- ✅ External API caching (15min TTL)
- ✅ Image uploads (Vercel Blob)

## Development

### Available Scripts

```bash
bun run dev              # Start dev server
bun run build            # Build for production
bun run start            # Start production server
bun run lint             # Run ESLint
bun run check-env        # Validate environment variables

# Database
bun run db:generate      # Generate migrations
bun run db:migrate       # Run migrations
bun run db:push          # Push schema changes
bun run db:studio        # Open Drizzle Studio
bun run db:seed          # Seed database
bun run db:wipe          # Wipe all data

# Testing
bun test                 # Run tests in watch mode
bun test:run             # Run tests once
bun test:ui              # Open test UI
bun test:coverage        # Generate coverage report
```

## Testing

The project has comprehensive test coverage with **239 passing tests**:

- External API clients (Flathub, AUR, Snapcraft, Repology)
- Command generation logic
- State management (Zustand)
- API utilities (rate limiting, auth, error handling)
- Custom hooks (clipboard)
- Utility functions

See `../TEST_COVERAGE_SUMMARY.md` for details.

## Architecture

### Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Database**: Drizzle ORM + Turso (libSQL)
- **Auth**: BetterAuth
- **UI**: shadcn/ui + Tailwind CSS
- **State**: Zustand
- **Storage**: Vercel Blob
- **Package Manager**: Bun

### API Structure
- **Public**: `/api/apps`, `/api/distros`, `/api/sources`, `/api/categories`, `/api/generate`
- **Admin**: All CRUD operations + `/api/refresh`, `/api/search`, `/api/upload`
- **Cron**: `/api/cron/refresh` (automated package updates)

### External APIs
- **Flathub**: App search and metadata
- **Snapcraft**: Snap package information
- **AUR**: Arch User Repository packages
- **Repology**: Cross-distro package availability

## Deployment

### Environment Variables

Required:
- `DATABASE_URL` - Turso database URL
- `DATABASE_AUTH_TOKEN` - Turso auth token
- `BETTER_AUTH_SECRET` - Auth secret (min 32 chars)
- `BETTER_AUTH_URL` - Base URL (e.g., https://linite.example.com)

Optional:
- `UPSTASH_REDIS_REST_URL` - Redis for rate limiting
- `UPSTASH_REDIS_REST_TOKEN` - Redis auth token
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob token
- `CRON_SECRET` - Secret for cron endpoint

### Vercel Deployment

1. Connect repository to Vercel
2. Set environment variables
3. Deploy

The app will automatically:
- Build the Next.js app
- Connect to Turso database
- Enable rate limiting (if Redis configured)
- Set up cron jobs for package refresh

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass (`bun test:run`)
6. Submit a pull request

## Support

For issues or questions:
- Check existing documentation
- Review test files for usage examples
- Open an issue on GitHub


---

**Built with ❤️ using Next.js, Drizzle, and Bun**
