# Linite

<div align="center">
  <img src="public/logo.svg" alt="Linite Logo" width="120" height="120">
  <p><strong>Bulk install Linux apps with a single command</strong></p>

  [![License: MIT](https://img.shields.io/github/license/sagyam/linite?style=for-the-badge)](LICENSE)
  [![zread](https://img.shields.io/badge/Ask_Zread-_.svg?style=for-the-badge&color=00b0aa&labelColor=000000&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQuOTYxNTYgMS42MDAxSDIuMjQxNTZDMS44ODgxIDEuNjAwMSAxLjYwMTU2IDEuODg2NjQgMS42MDE1NiAyLjI0MDFWNC45NjAxQzEuNjAxNTYgNS4zMTM1NiAxLjg4ODEgNS42MDAxIDIuMjQxNTYgNS42MDAxSDQuOTYxNTZDNS4zMTUwMiA1LjYwMDEgNS42MDE1NiA1LjMxMzU2IDUuNjAxNTYgNC45NjAxVjIuMjQwMUM1LjYwMTU2IDEuODg2NjQgNS4zMTUwMiAxLjYwMDEgNC45NjE1NiAxLjYwMDFaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00Ljk2MTU2IDEwLjM5OTlIMi4yNDE1NkMxLjg4ODEgMTAuMzk5OSAxLjYwMTU2IDEwLjY4NjQgMS42MDE1NiAxMS4wMzk5VjEzLjc1OTlDMS42MDE1NiAxNC4xMTM0IDEuODg4MSAxNC4zOTk5IDIuMjQxNTYgMTQuMzk5OUg0Ljk2MTU2QzUuMzE1MDIgMTQuMzk5OSA1LjYwMTU2IDE0LjExMzQgNS42MDE1NiAxMy43NTk5VjExLjAzOTlDNS42MDE1NiAxMC42ODY0IDUuMzE1MDIgMTAuMzk5OSA0Ljk2MTU2IDEwLjM5OTlaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik0xMy43NTg0IDEuNjAwMUgxMS4wMzg0QzEwLjY4NSAxLjYwMDEgMTAuMzk4NCAxLjg4NjY0IDEwLjM5ODQgMi4yNDAxVjQuOTYwMUMxMC4zOTg0IDUuMzEzNTYgMTAuNjg1IDUuNjAwMSAxMS4wMzg0IDUuNjAwMUgxMy43NTg0QzE0LjExMTkgNS42MDAxIDE0LjM5ODQgNS4zMTM1NiAxNC4zOTg0IDQuOTYwMVYyLjI0MDFDMTQuMzk4NCAxLjg4NjY0IDE0LjExMTkgMS42MDAxIDEzLjc1ODQgMS42MDAxWiIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNNCAxMkwxMiA0TDQgMTJaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00IDEyTDEyIDQiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K&logoColor=ffffff)](https://zread.ai/Sagyam/linite)
  ![Build](https://img.shields.io/github/actions/workflow/status/sagyam/linite/ci.yml?branch=main&style=for-the-badge)

  [Try it now](https://linite.sagyamthapa.com.np) · [Report Bug](https://github.com/Sagyam/linite/issues) · [Request Feature](https://github.com/Sagyam/linite/issues)
</div>

## Overview

Linite is a Ninite-style package installer for Linux distributions and Windows. It aggregates applications from multiple package sources (APT, DNF, Pacman, Zypper, Nix, Flatpak, Snap, AUR, Homebrew, Winget, Scoop) and generates a installation commands based on your platform and preferences.

Instead of manually searching for packages across different repositories and running multiple package manager commands, Linite provides a web interface to select applications and outputs a single, ready-to-run installation script.

**[Website](https://linite.sagyamthapa.com.np)** | **[Dev Docs](https://zread.ai/Sagyam/linite)**

<img src="./public/demo.gif" alt="Linite Demo" width="800">

## Quick Start

Visit [website](https://linite.sagyamthapa.com.np), select your apps and distribution, then copy the generated command.

**Example output for Ubuntu 24.04:**

```bash
# Setup
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo

# Install
sudo apt install -y firefox git
flatpak install -y flathub org.videolan.VLC com.visualstudio.code
```

## Features

### Multi-Source Package Support
Linite integrates with native package managers (APT, DNF, Pacman, Zypper, Nix, Winget), universal formats (Flatpak, Snap), community repositories (AUR, Homebrew, Scoop), and script-based installations. The package selection algorithm prioritizes sources based on distribution defaults and user preferences.

### Automatic Package Selection
For each application, Linite queries available packages across sources and selects the optimal one based on:
- Distribution-specific source priorities
- User-configured preferences
- Package availability and version information

The command generator groups packages by source and includes necessary setup commands (e.g., adding Flatpak remotes).

### Package Metadata Sync
Package information is synchronized every 24 hours from:
- [Flathub](https://flathub.org/) - Flatpak packages
- [Snapcraft](https://snapcraft.io/) - Snap packages
- [AUR](https://aur.archlinux.org/) - Arch User Repository
- [Homebrew](https://formulae.brew.sh/) - Homebrew formulae
- [NixHub](https://www.nixhub.io/) - Nix packages
- [Winget](https://winget.run/) - Windows Package Manager
- [Repology](https://repology.org/) - Cross-platform package tracking

This ensures version numbers, licenses, and availability status stay current across all platforms.

### Catalog Management
The application database currently includes 170+ applications organized into 10 categories. Administrators can manage apps, packages, and source mappings through an authenticated admin interface.

## Supported Platforms

### Linux Distributions

**Debian Family**
- Ubuntu: APT, Flatpak, Snap
- Debian: APT, Flatpak
- Linux Mint: APT, Flatpak
- Pop!_OS: APT, Flatpak
- Zorin OS: APT, Flatpak, Snap
- Elementary OS: APT, Flatpak

**RHEL/Fedora Family**
- Fedora: DNF, Flatpak
- Nobara: DNF, Flatpak
- Bazzite: Flatpak, Homebrew

**Arch Family**
- Arch Linux: Pacman, AUR, Flatpak
- Manjaro: Pacman, AUR, Flatpak, Snap
- CachyOS: Pacman, AUR, Flatpak

**Other**
- openSUSE: Zypper, Flatpak
- NixOS: Nix, Flatpak, Snap

### Windows
- Windows: Winget, Scoop

All distributions support script-based installations as a fallback. Additional platforms can be added by mapping package manager support in the database.

## Architecture

**Frontend:** Next.js 16 (App Router) with TypeScript, React, and Tailwind CSS
**UI Components:** shadcn/ui
**Database:** Turso (libSQL) with Drizzle ORM
**Authentication:** BetterAuth
**Storage:** Azure Blob Storage (app icons)
**APIs:** Flathub, Snapcraft, AUR, Repology
**Deployment:** Vercel

See [docs/PROJECT_OVERVIEW.md](./docs/PROJECT_OVERVIEW.md) for detailed architecture documentation.

## Development

### Prerequisites
- Bun package manager
- Turso database (or local libSQL)
- Azure Blob Storage account (for icon uploads)

### Setup

```bash
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

### Database Commands

```bash
bun run db:generate   # Generate migrations from schema changes
bun run db:migrate    # Apply migrations
bun run db:push       # Push schema directly (development)
bun run db:studio     # Open Drizzle Studio
bun run db:wipe       # Clear all data
bun run db:seed       # Populate initial data
```

### Testing

```bash
bun test              # Watch mode
bun test:run          # Run once
bun test:coverage     # With coverage report
```

239 tests covering API routes, services, and UI components. Tests are co-located with source files (`*.test.ts`, `*.test.tsx`).

### Documentation

- [API Reference](./docs/API_REFERENCE.md) - Endpoint specifications
- [Database Schema](./docs/DATABASE_SCHEMA.md) - Complete schema definition
- [Environment Variables](./docs/ENVIRONMENT.md) - Configuration reference

## Contributing

Contributions are welcome. Please open an issue to discuss significant changes before submitting PRs. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Common contributions:
- Adding applications to the catalog
- Expanding distribution support
- Improving package selection algorithms
- Bug fixes and performance improvements

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

Inspired by [Ninite](https://ninite.com/). Package data provided by [Flathub](https://flathub.org/), [Snapcraft](https://snapcraft.io/), [AUR](https://aur.archlinux.org/), [Homebrew](https://formulae.brew.sh/), [NixHub](https://www.nixhub.io/), [Winget](https://winget.run/), and [Repology](https://repology.org/). UI components from [shadcn/ui](https://ui.shadcn.com/).
