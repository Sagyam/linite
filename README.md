# Linite

A Ninite-style bulk package installer for Linux distributions.

## Overview

Linite allows users to select multiple applications from a curated catalog, choose their Linux distribution and preferred package sources, and receive a single command to install all selected packages.

**Key Features:**
- Curated application catalog with rich metadata
- Support for multiple package sources (Flatpak, Snap, APT, DNF, Pacman, AUR, Zypper)
- Smart package selection based on distribution
- One-command installation
- Admin panel for managing apps, packages, and distributions

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), shadcn/ui, Tailwind CSS
- **Backend**: Drizzle ORM, Turso/SQLite
- **Auth**: BetterAuth
- **State Management**: Zustand
- **Package Manager**: bun

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.0.0 or higher)
- Node.js 20+ (for Next.js)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd linite
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your values
```

See [docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md) for detailed setup instructions.

4. Validate your environment:
```bash
bun run check-env
```

5. Set up the database:
```bash
bun run db:generate  # Generate migrations
bun run db:migrate   # Run migrations
bun run db:seed      # Seed with initial data
```

6. Start the development server:
```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Admin Access

After seeding, you can access the admin panel at `/admin/login` with:
- Email: `admin@linite.local`
- Password: `admin123`

**Important:** Change these credentials after first login!

## Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run check-env` - Validate environment variables
- `bun run db:generate` - Generate database migrations
- `bun run db:migrate` - Run database migrations
- `bun run db:push` - Push schema changes to database
- `bun run db:studio` - Open Drizzle Studio (database GUI)
- `bun run db:seed` - Seed database with sample data

## Deployment

### Production with Turso

1. Create a Turso database:
```bash
turso db create linite
turso db show linite
```

2. Get your database URL and auth token:
```bash
turso db show linite --url
turso db tokens create linite
```

3. Update production environment variables:
```env
DATABASE_URL="libsql://your-database-url"
DATABASE_AUTH_TOKEN="your-auth-token"
```

4. Deploy to Vercel and configure environment variables

### Vercel Cron

The project includes a cron job (`vercel.json`) that automatically refreshes package metadata every 24 hours.

## Documentation

Full documentation is available in the `/docs` folder:

- [Project Overview](./docs/PROJECT_OVERVIEW.md)
- [Database Schema](./docs/DATABASE_SCHEMA.md)
- [API Reference](./docs/API_REFERENCE.md)
- [Environment Setup](./docs/ENVIRONMENT.md)
- [Repository Structure](./docs/REPOSITORY_STRUCTURE.md)
- [Initial Data](./docs/INITIAL_DATA.md)
- [Tasks](./docs/TASKS.md)
- [Implementation Status](./docs/SPEC.md)

## Development

See [CLAUDE.md](./CLAUDE.md) for development guidelines and instructions.

## License

MIT
