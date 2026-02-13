# Linite

<div>
  <img src="public/logo.svg" alt="Linite Logo" width="120" height="120">
  <p><strong>Bulk install Linux apps with a single command</strong></p>

  [![License: MIT](https://img.shields.io/github/license/sagyam/linite?style=for-the-badge)](LICENSE)
  [![zread](https://img.shields.io/badge/Ask_Zread-_.svg?style=for-the-badge&color=00b0aa&labelColor=000000&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQuOTYxNTYgMS42MDAxSDIuMjQxNTZDMS44ODgxIDEuNjAwMSAxLjYwMTU2IDEuODg2NjQgMS42MDE1NiAyLjI0MDFWNC45NjAxQzEuNjAxNTYgNS4zMTM1NiAxLjg4ODEgNS42MDAxIDIuMjQxNTYgNS42MDAxSDQuOTYxNTZDNS4zMTUwMiA1LjYwMDEgNS42MDE1NiA1LjMxMzU2IDUuNjAxNTYgNC45NjAxVjIuMjQwMUM1LjYwMTU2IDEuODg2NjQgNS4zMTUwMiAxLjYwMDEgNC45NjE1NiAxLjYwMDFaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00Ljk2MTU2IDEwLjM5OTlIMi4yNDE1NkMxLjg4ODEgMTAuMzk5OSAxLjYwMTU2IDEwLjY4NjQgMS42MDE1NiAxMS4wMzk5VjEzLjc1OTlDMS42MDE1NiAxNC4xMTM0IDEuODg4MSAxNC4zOTk5IDIuMjQxNTYgMTQuMzk5OUg0Ljk2MTU2QzUuMzE1MDIgMTQuMzk5OSA1LjYwMTU2IDE0LjExMzQgNS42MDE1NiAxMy43NTk5VjExLjAzOTlDNS42MDE1NiAxMC42ODY0IDUuMzE1MDIgMTAuMzk5OSA0Ljk2MTU2IDEwLjM5OTlaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik0xMy43NTg0IDEuNjAwMUgxMS4wMzg0QzEwLjY4NSAxLjYwMDEgMTAuMzk4NCAxLjg4NjY0IDEwLjM5ODQgMi4yNDAxVjQuOTYwMUMxMC4zOTg0IDUuMzEzNTYgMTAuNjg1IDUuNjAwMSAxMS4wMzg0IDUuNjAwMUgxMy43NTg0QzE0LjExMTkgNS42MDAxIDE0LjM5ODQgNS4zMTM1NiAxNC4zOTg0IDQuOTYwMVYyLjI0MDFDMTQuMzk4NCAxLjg4NjY0IDE0LjExMTkgMS42MDAxIDEzLjc1ODQgMS42MDAxWiIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNNCAxMkwxMiA0TDQgMTJaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00IDEyTDEyIDQiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K&logoColor=ffffff)](https://zread.ai/Sagyam/linite)
  ![Website](https://img.shields.io/website?url=https%3A%2F%2Flinite.sagyamthapa.com.np&style=for-the-badge)
  ![Build](https://img.shields.io/github/actions/workflow/status/sagyam/linite/ci.yml?branch=main&style=for-the-badge)
  ![Try it now](https://linite.sagyamthapa.com.np) · [Report Bug](https://github.com/Sagyam/linite/issues) · [Request Feature](https://github.com/Sagyam/linite/issues)
</div>

## Overview

Linite is a bulk package installer for Linux distributions and Windows. It aggregates applications from multiple package sources (APT, DNF, Pacman, Zypper, Nix, Flatpak, Snap, AUR, Homebrew) and generates a installation commands based on your platform and preferences.

Instead of manually searching for packages across different repositories and running multiple package manager commands, Linite provides a web interface to select applications and outputs a single, ready-to-run installation script.

**[Website](https://linite.sagyamthapa.com.np)** | **[Dev Docs](https://zread.ai/Sagyam/linite)**

<img src="./public/demo.gif" alt="Linite Demo" width="800">


## Features

- **Multi-Source Support** - Native (APT, DNF, Pacman, Zypper, Nix, Winget), universal (Flatpak, Snap), and community (AUR, Homebrew, Scoop) package managers
- **Smart Package Selection** - Automatic source prioritization based on distro defaults and user preferences
- **Daily Metadata Sync** - Package versions and availability updated from Flathub, Snapcraft, AUR, Homebrew, NixHub, Winget, Scoop, and Repology
- **170+ Curated Apps** - Admin-managed catalog across 10 categories with rich metadata
- **Collections** - Save, share, and discover curated app lists
- **Installation Tracking** - Track installations across devices and generate uninstall commands

## Supported Platforms

### Linux Distributions

**Debian Family**
- Ubuntu: APT, Flatpak, Snap, Script
- Debian: APT, Flatpak, Snap, Script
- Linux Mint: APT, Flatpak, Script
- Pop!_OS: APT, Flatpak, Snap, Script
- Zorin OS: APT, Flatpak, Snap, Script
- Elementary OS: APT, Flatpak, Snap, Script

**RHEL/Fedora Family**
- Fedora: DNF, Flatpak, Snap, Script
- Nobara: DNF, Flatpak, Snap, Script
- Bazzite: Flatpak, Homebrew, Snap, Script

**Arch Family**
- Arch Linux: Pacman, AUR, Flatpak, Script
- Manjaro: Pacman, AUR, Flatpak, Snap, Script
- CachyOS: Pacman, AUR, Flatpak, Script

**Other**
- openSUSE: Zypper, Flatpak, Script
- NixOS: Nix, Flatpak, Snap, Script

### Windows
- Windows: Winget, Scoop, Script

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

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

Inspired by [Ninite](https://ninite.com/). Package data provided by [Flathub](https://flathub.org/), [Snapcraft](https://snapcraft.io/), [AUR](https://aur.archlinux.org/), [Homebrew](https://formulae.brew.sh/), [NixHub](https://www.nixhub.io/), [Winget](https://winget.run/), and [Repology](https://repology.org/). UI components from [shadcn/ui](https://ui.shadcn.com/).
