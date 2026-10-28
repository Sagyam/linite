<p align="center">
  <img src="public/logo.svg" width="140" alt="Linite logo: three picked app tiles and a terminal prompt">
</p>

<h1 align="center">Linite</h1>

<h3 align="center">Pick your apps. Get one command.</h3>

<p align="center">
  <a href="https://linite.sagyamthapa.com.np">Try it</a> ·
  <a href="#tour">Tour</a> ·
  <a href="#works-with">Works with</a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="CONTRIBUTING.md">Contributing</a>
</p>

<p align="center">
  <b>A Ninite-style bulk installer for Linux.</b><br>
  Choose your distro, tick apps from a curated catalog, and copy the apt, dnf, pacman, Flatpak or Snap command that installs them all.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js 16">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Bun-1.4-000000?style=flat-square&logo=bun&logoColor=white" alt="Bun 1.4">
  <img src="https://img.shields.io/badge/Turso-4FF8D2?style=flat-square&logo=turso&logoColor=black" alt="Turso">
  <img src="https://img.shields.io/badge/Drizzle-C5F74F?style=flat-square&logo=drizzle&logoColor=black" alt="Drizzle ORM">
  <br>
  <img src="https://img.shields.io/github/actions/workflow/status/sagyam/linite/ci.yml?branch=main&style=flat-square&label=tests" alt="CI status">
  <img src="https://img.shields.io/website?url=https%3A%2F%2Flinite.sagyamthapa.com.np&style=flat-square" alt="Website status">
  <img src="https://img.shields.io/badge/apps-200%2B-1688c4?style=flat-square" alt="200+ apps">
  <img src="https://img.shields.io/badge/platforms-15-1688c4?style=flat-square" alt="15 platforms">
  <img src="https://img.shields.io/badge/license-MIT-f2b134?style=flat-square" alt="MIT license">
</p>

<p align="center">
  <img src="docs/screenshots/demo.gif" width="960" alt="Picking five apps, choosing Fedora, getting the install command, switching to the detailed view, browsing collections, and the dark theme">
</p>

## Tour

<table>
<tr>
<td width="50%"><img src="docs/screenshots/selection.png" alt="Picking apps"><br><b>Pick.</b> Tick apps from 14 categories. The bar at the bottom keeps count.</td>
<td width="50%"><img src="docs/screenshots/command.png" alt="The install command"><br><b>Copy.</b> One block per package manager, setup steps first, and a warning for anything your distro lacks.</td>
</tr>
<tr>
<td><img src="docs/screenshots/detailed.png" alt="Detailed view"><br><b>Compare.</b> The detailed view lists every source an app ships through.</td>
<td><img src="docs/screenshots/collections.png" alt="Collections"><br><b>Collections.</b> Start from a curated list for developers, creators or gamers.</td>
</tr>
<tr>
<td><img src="docs/screenshots/collection.png" alt="A collection"><br><b>Share.</b> Save your own lists, share them, and apply one in a click.</td>
<td><img src="docs/screenshots/home-dark.png" alt="Dark theme"><br><b>Light or dark, keyboard first.</b> <code>/</code> to search, <code>j</code> <code>k</code> to move, <code>Space</code> to pick, <code>c</code> for the command.</td>
</tr>
</table>

## Works with

<p>
  <img src="https://img.shields.io/badge/Ubuntu-E95420?style=flat-square&logo=ubuntu&logoColor=white" alt="Ubuntu">
  <img src="https://img.shields.io/badge/Debian-A81D33?style=flat-square&logo=debian&logoColor=white" alt="Debian">
  <img src="https://img.shields.io/badge/Linux_Mint-87CF3E?style=flat-square&logo=linuxmint&logoColor=white" alt="Linux Mint">
  <img src="https://img.shields.io/badge/Pop!__OS-48B9C7?style=flat-square&logo=popos&logoColor=white" alt="Pop!_OS">
  <img src="https://img.shields.io/badge/Zorin_OS-15A6F0?style=flat-square&logo=zorin&logoColor=white" alt="Zorin OS">
  <img src="https://img.shields.io/badge/elementary_OS-64BAFF?style=flat-square&logo=elementary&logoColor=white" alt="elementary OS">
  <img src="https://img.shields.io/badge/Fedora-51A2DA?style=flat-square&logo=fedora&logoColor=white" alt="Fedora">
  <img src="https://img.shields.io/badge/Nobara-4A4A4A?style=flat-square&logo=linux&logoColor=white" alt="Nobara">
  <img src="https://img.shields.io/badge/Bazzite-7B68EE?style=flat-square&logo=linux&logoColor=white" alt="Bazzite">
  <img src="https://img.shields.io/badge/Arch_Linux-1793D1?style=flat-square&logo=archlinux&logoColor=white" alt="Arch Linux">
  <img src="https://img.shields.io/badge/Manjaro-35BF5C?style=flat-square&logo=manjaro&logoColor=white" alt="Manjaro">
  <img src="https://img.shields.io/badge/CachyOS-5C2D91?style=flat-square&logo=archlinux&logoColor=white" alt="CachyOS">
  <img src="https://img.shields.io/badge/openSUSE-73BA25?style=flat-square&logo=opensuse&logoColor=white" alt="openSUSE">
  <img src="https://img.shields.io/badge/NixOS-5277C3?style=flat-square&logo=nixos&logoColor=white" alt="NixOS">
  <img src="https://img.shields.io/badge/Windows-0078D4?style=flat-square&logo=windows&logoColor=white" alt="Windows">
</p>
<p>
  <img src="https://img.shields.io/badge/APT-A81D33?style=flat-square&logo=debian&logoColor=white" alt="APT">
  <img src="https://img.shields.io/badge/DNF-51A2DA?style=flat-square&logo=fedora&logoColor=white" alt="DNF">
  <img src="https://img.shields.io/badge/Pacman-1793D1?style=flat-square&logo=archlinux&logoColor=white" alt="Pacman">
  <img src="https://img.shields.io/badge/AUR-1793D1?style=flat-square&logo=archlinux&logoColor=white" alt="AUR">
  <img src="https://img.shields.io/badge/Zypper-73BA25?style=flat-square&logo=opensuse&logoColor=white" alt="Zypper">
  <img src="https://img.shields.io/badge/Nix-5277C3?style=flat-square&logo=nixos&logoColor=white" alt="Nix">
  <img src="https://img.shields.io/badge/Flatpak-4A86CF?style=flat-square&logo=flatpak&logoColor=white" alt="Flatpak">
  <img src="https://img.shields.io/badge/Snap-82BEA0?style=flat-square&logo=snapcraft&logoColor=white" alt="Snap">
  <img src="https://img.shields.io/badge/Homebrew-FBB040?style=flat-square&logo=homebrew&logoColor=black" alt="Homebrew">
  <img src="https://img.shields.io/badge/Winget-0078D4?style=flat-square&logo=windows&logoColor=white" alt="Winget">
  <img src="https://img.shields.io/badge/Scoop-6BB9F0?style=flat-square&logo=windows&logoColor=white" alt="Scoop">
</p>

## Quick start

```bash
git clone https://github.com/Sagyam/linite.git
cd linite
bun install
cp .env.example .env   # fill in, see docs/ENVIRONMENT.md
bun run db:push && bun run db:seed
bun run dev            # http://localhost:3000
```

More in [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/](docs).

## Credits

Inspired by [Ninite](https://ninite.com/). Package data from [Flathub](https://flathub.org/), [Snapcraft](https://snapcraft.io/), [AUR](https://aur.archlinux.org/), [Homebrew](https://formulae.brew.sh/) and [Repology](https://repology.org/). MIT licensed, see [LICENSE](LICENSE).
