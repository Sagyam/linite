<div align="center">
  <img src="public/logo.svg" alt="Linite Logo" width="120" height="120">

  # Linite

  **Bulk install Linux apps with a single command**

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
  [![CI](https://github.com/Sagyam/linite/actions/workflows/ci.yml/badge.svg)](https://github.com/Sagyam/linite/actions/workflows/ci.yml)
  [![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
  [![Tests](https://img.shields.io/badge/tests-172%20passing-success)](https://github.com/Sagyam/linite)

  [Try it now](https://linite.sagyamthapa.com.np) · [Report Bug](https://github.com/Sagyam/linite/issues) · [Request Feature](https://github.com/Sagyam/linite/issues)

</div>

---

## 🎯 What is Linite?

Linite is like **Ninite for Linux** - select the apps you want, choose your distribution, and get a single command to install everything at once. No more copying commands from different websites or running multiple package managers.

### The Problem

Setting up a new Linux system or installing multiple applications usually means:
- 🔍 Searching for package names across different sources
- 📝 Running separate commands for APT, Flatpak, Snap, AUR, etc.
- 🤔 Figuring out which package manager has the app you need
- ⏰ Wasting time on a repetitive task

### The Solution

**Linite simplifies this to 3 steps:**

1. **Browse & Select** - Pick apps from our curated catalog
2. **Choose Your Distro** - Ubuntu, Fedora, Arch, openSUSE, and more
3. **Copy & Run** - Get a single install command with everything

<!-- DEMO GIF PLACEHOLDER -->
<div align="center">
  <img src="demo.gif" alt="Linite Demo" width="800">
  <p><i>Demo: Installing multiple apps with a single command</i></p>
</div>

---

## ✨ Features

### 🎨 **Beautiful, Modern Interface**
- Clean, intuitive app browsing with categories
- **Compact & Detailed** view modes
- Smooth animations and responsive design
- Works perfectly on mobile and desktop

### 📦 **Wide Package Coverage**
Support for all major package sources:
- **Native**: APT, DNF, Pacman, Zypper
- **Universal**: Flatpak, Snap
- **Community**: AUR (Arch User Repository)

### 🔍 **Smart Package Selection**
- Automatically picks the best source for your distro
- Respects your package manager preferences
- Shows package availability across sources
- Displays version info, licenses, and maintainers

### 🚀 **Always Up-to-Date**
- Package metadata refreshed every 24 hours
- Integration with Flathub, Snapcraft, AUR, and Repology
- Latest version information
- Availability status tracking

### 📋 **One-Click Commands**
- Generate complete install commands
- Includes setup commands when needed
- Copy to clipboard with one click
- Smart grouping by package manager

---

## 🚀 Getting Started

### For Users

Just visit **[website](https://linite.sagyamthapa.com.np)** and start selecting apps!

No installation needed - it's a web application.

### Example Usage

1. **Select your apps:**
   - Firefox (browser)
   - VS Code (editor)
   - VLC (media player)
   - Git (version control)

2. **Choose your distribution:**
   - Ubuntu 24.04

3. **Get your command:**
   ```bash
   # Setup
   flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo

   # Install
   sudo apt install -y firefox git
   flatpak install -y flathub org.videolan.VLC com.visualstudio.code
   ```

That's it! One command installs everything.

---

## 🎯 Use Cases

### 🆕 **Fresh Install**
Setting up a new Linux machine? Select all your essential apps and get them installed in minutes.

### 🔄 **System Migration**
Switching distros? Linite helps you quickly reinstall your favorite apps on the new system.

### 👥 **Team Setups**
Share install commands with your team to ensure everyone has the same development tools.

### 🎓 **Teaching**
Perfect for computer labs or workshops - get students set up with required software quickly.

---

## 🌟 Supported Distributions

| Distribution | Package Managers | Status |
|-------------|------------------|--------|
| **Ubuntu** / Debian | APT, Flatpak, Snap | ✅ Fully Supported |
| **Fedora** / RHEL | DNF, Flatpak, Snap | ✅ Fully Supported |
| **Arch Linux** | Pacman, AUR, Flatpak | ✅ Fully Supported |
| **openSUSE** | Zypper, Flatpak, Snap | ✅ Fully Supported |
| **Linux Mint** | APT, Flatpak | ✅ Fully Supported |
| **Manjaro** | Pacman, AUR, Flatpak | ✅ Fully Supported |
| **Pop!_OS** | APT, Flatpak | ✅ Fully Supported |

*More distributions coming soon!*

---

## 🎨 Screenshots

### Browse Apps by Category
Organized collections of browsers, development tools, media apps, and more.

### Detailed App Information
View package details including versions, licenses, screenshots, and cross-platform availability.

### Smart Command Generation
Automatically optimized install commands based on your distribution and preferences.

---

## 💡 How It Works

1. **Curated App Database** - We maintain a database of popular Linux applications
2. **Package Mapping** - Each app is mapped to available packages across different sources
3. **Metadata Sync** - Package information is kept fresh through API integrations
4. **Smart Selection** - Algorithm picks the best package based on your distro and preferences
5. **Command Generation** - Builds optimized install commands grouped by package manager

---

## 🛠️ Tech Stack

Built with modern, reliable technologies:

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Turso (libSQL) with Drizzle ORM
- **Authentication**: BetterAuth
- **Storage**: Vercel Blob
- **APIs**: Flathub, Snapcraft, AUR, Repology
- **Deployment**: Vercel

---

## 📊 Project Stats

- 📦 **170+ Apps** in catalog
- 🎯 **10 Categories** organized
- 🔄 **7 Package Sources** supported
- 🧪 **172 Tests** passing
- 🐧 **8+ Distributions** covered

---

## 🤝 Contributing

We welcome contributions! Whether it's:

- 🐛 Reporting bugs
- 💡 Suggesting new features
- 📝 Improving documentation
- ➕ Adding new apps to the catalog
- 🔧 Fixing issues

Check out our [Contributing Guide](CONTRIBUTING.md) to get started.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by [Ninite](https://ninite.com/) for Windows
- Package data from [Flathub](https://flathub.org/), [Snapcraft](https://snapcraft.io/), [AUR](https://aur.archlinux.org/), and [Repology](https://repology.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)

---

## 📞 Support

Need help? Have questions?

- 📖 Check the [Documentation](./docs/README.md)
- 🐛 [Report an Issue](https://github.com/Sagyam/linite/issues)
- 💬 [Start a Discussion](https://github.com/Sagyam/linite/discussions)

---

<div align="center">

  **Made with ❤️ for the Linux community**

  [⭐ Star this repo](https://github.com/Sagyam/linite) if you find it useful!

</div>
