# Linite - Project Overview

> A Ninite-style bulk package installer for Linux distributions

## What is Linite?

Linite is a web application that allows users to select multiple applications from a curated catalog, choose their operating system/distribution and preferred package sources, and receive a single script to install or uninstall all selected packages. The platform focuses on quality over quantity—featuring only admin-curated applications with rich metadata. Supports Linux distributions and Windows.

## Key Features

- **Curated Application Catalog**: Admin-managed, high-quality application selection
- **Multi-Source Support**: Flatpak, Snap, APT, DNF, Pacman, AUR, Zypper, Homebrew, third-party repos (PPA, RPM Fusion, COPR)
- **Smart Package Selection**: Intelligent source preference based on distribution
- **One-Command Install/Uninstall**: Generate single bash/PowerShell script for all selected apps
- **Uninstall Support**: Track installations across devices, generate uninstall commands
- **Category Colors**: Visual categorization with theme-aware colors
- **Keyboard Shortcuts**: Vim-inspired navigation for power users
- **Rich Metadata**: Version info, package sizes, maintainers, FOSS badges
- **Admin Panel**: Full CRUD interface for managing apps, packages, distros
- **Auto-Refresh**: Scheduled updates from external package APIs

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: Zustand (for client-side selection state)
- **Form Handling**: React Hook Form + Zod validation
- **Icons**: Lucide React

### Backend
- **API**: Next.js API Routes (App Router)
- **ORM**: Drizzle ORM
- **Database**: Turso (libSQL)
- **Authentication**: BetterAuth (email/password)
- **Background Jobs**: Vercel Cron (for periodic data refresh)

### Infrastructure
- **Hosting**: Vercel
- **Image Storage**: Azure Blob Storage (for app icons)
- **Analytics**: Vercel Analytics (optional)

### External APIs
- **Flathub API**: `https://flathub.org/api/v2/`
- **Snapcraft API**: `https://api.snapcraft.io/v2/`
- **Repology API**: `https://repology.org/api/v1/`
- **AUR RPC**: `https://aur.archlinux.org/rpc/`
- **Homebrew API**: `https://formulae.brew.sh/api/`

## Target Users

1. **Linux Beginners**: Easy way to set up a new system with essential apps
2. **System Administrators**: Quick deployment of standard toolsets
3. **Developers**: Rapid dev environment setup
4. **Linux Enthusiasts**: Efficient package management across distros
