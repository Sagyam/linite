#!/usr/bin/env bun

/**
 * Docker-Based Package Validation
 *
 * Uses actual package managers in Docker containers to validate all packages.
 * This is the single source of truth for package validation.
 *
 * Usage:
 *   bun run scripts/validate-seed-docker.ts # All sources
 *   bun run scripts/validate-seed-docker.ts apt # Single source
 *
 * Supported sources:
 *   - Linux distros: apt, dnf, zypper, pacman, aur, nix
 *   - Universal: flatpak, snap
 *   - Languages: npm, pip, cargo, go
 *   - macOS: homebrew
 *   - Scripts: script (URL validation)
 *   - Skipped: chocolatey, winget, scoop (Windows-only)
 *
 * Requirements:
 *   - Docker installed and running
 *   - Internet connection for pulling images and updating repos
 *
 * Exit codes:
 *   - 0: All packages validated successfully
 *   - 1: Some packages failed validation
 *   - 2: Docker not available or fatal error
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';

// Types
interface Package {
  app: string;
  identifier: string;
  isAvailable: boolean;
  source: string;
  metadata?: {
    scriptUrl?: {
      linux?: string;
      windows?: string;
    };
  };
}

interface ContainerConfig {
  name: string;
  image: string;
  setupCommand: string;
  validationCommand: (identifier: string) => string;
}

// Docker container configurations for each source
const CONTAINERS: Record<string, ContainerConfig> = {
  // Linux distro package managers
  apt: {
    name: 'linite-validator-apt',
    image: 'ubuntu:latest',
    setupCommand: 'sed -i "s/^# deb/deb/g" /etc/apt/sources.list && apt-get update -qq 2>&1',
    validationCommand: (id) => `apt-cache show "${id}" >/dev/null 2>&1`,
  },
  dnf: {
    name: 'linite-validator-dnf',
    image: 'fedora:latest',
    setupCommand: 'dnf makecache -y 2>&1',
    validationCommand: (id) => `dnf info "${id}" 2>&1 | grep -q "^Name"`,
  },
  zypper: {
    name: 'linite-validator-zypper',
    image: 'opensuse/tumbleweed:latest',
    setupCommand: 'zypper --non-interactive --gpg-auto-import-keys refresh',
    validationCommand: (id) => `zypper info "${id}" >/dev/null 2>&1`,
  },
  pacman: {
    name: 'linite-validator-pacman',
    image: 'archlinux:latest',
    setupCommand: 'sed -i "s/^SigLevel.*/SigLevel = Never/g" /etc/pacman.conf && pacman -Sy --noconfirm 2>&1',
    validationCommand: (id) => `pacman -Si "${id}" >/dev/null 2>&1`,
  },
  // AUR uses API, no Docker needed (handled specially in validatePackage)
  nix: {
    name: 'linite-validator-nix',
    image: 'nixos/nix:latest',
    setupCommand: 'nix-channel --add https://nixos.org/channels/nixpkgs-unstable nixpkgs && nix-channel --update 2>&1',
    validationCommand: (id) =>
      `nix-env -qaP ".*${id}.*" 2>/dev/null | head -1 | grep -qi "${id}"`,
  },

  // Universal package formats (use APIs, handled specially in validatePackage)
  flatpak: {
    name: 'linite-validator-flatpak',
    image: 'ubuntu:latest',
    setupCommand: '',
    validationCommand: (id) => ``,
  },
  snap: {
    name: 'linite-validator-snap',
    image: 'ubuntu:latest',
    setupCommand: '',
    validationCommand: (id) => ``,
  },

  // Language package managers
  npm: {
    name: 'linite-validator-npm',
    image: 'node:latest',
    setupCommand: 'npm --version',
    validationCommand: (id) => `npm view "${id}" version >/dev/null 2>&1`,
  },
  pip: {
    name: 'linite-validator-pip',
    image: 'python:latest',
    setupCommand: 'pip --version',
    validationCommand: (id) => `pip index versions "${id}" 2>&1 | grep -q "Available versions"`,
  },
  cargo: {
    name: 'linite-validator-cargo',
    image: 'rust:latest',
    setupCommand: 'cargo --version',
    validationCommand: (id) => `cargo search --limit 1 "^${id}$" 2>&1 | head -1 | grep -q "${id}"`,
  },
  go: {
    name: 'linite-validator-go',
    image: 'golang:latest',
    setupCommand: 'apt-get update -qq && apt-get install -y curl',
    validationCommand: (id) => {
      const cleanId = id.replace('@latest', '');
      return `curl -sf "https://proxy.golang.org/${cleanId}/@latest" >/dev/null 2>&1`;
    },
  },

  // Homebrew (uses API, handled specially in validatePackage)
  homebrew: {
    name: 'linite-validator-homebrew',
    image: 'homebrew/brew:latest',
    setupCommand: '',
    validationCommand: (id) => ``,
  },
};

// Sources to skip (Windows-only, can't validate in Linux Docker)
const SKIP_SOURCES = new Set(['chocolatey', 'winget', 'scoop']);

// Check if Docker is available
function checkDockerAvailable(): boolean {
  const result = spawnSync('docker', ['--version'], { stdio: 'pipe' });
  if (result.status !== 0) {
    console.error('❌ Docker is not installed or not running');
    console.error('   Please install Docker: https://docs.docker.com/get-docker/');
    return false;
  }

  const psResult = spawnSync('docker', ['ps'], { stdio: 'pipe' });
  if (psResult.status !== 0) {
    console.error('❌ Docker daemon is not running');
    console.error('   Please start Docker daemon');
    return false;
  }

  return true;
}

// Execute command in Docker container
function dockerExec(containerName: string, command: string, timeout = 30000): boolean {
  const result = spawnSync('docker', ['exec', containerName, 'bash', '-c', command], {
    stdio: 'pipe',
    timeout,
  });
  return result.status === 0;
}

// Start a Docker container
function startContainer(config: ContainerConfig): boolean {
  // Pull image
  console.log(`  Pulling ${config.image}...`);
  const pullResult = spawnSync('docker', ['pull', '-q', config.image], {
    stdio: 'inherit',
    timeout: 300000, // 5-minute timeout for pulls
  });

  if (pullResult.status !== 0) {
    console.error(`  ✗ Failed to pull image`);
    return false;
  }

  // Remove the existing container if present
  spawnSync('docker', ['rm', '-f', config.name], { stdio: 'ignore' });

  // Start container (keep alive with sleep infinity)
  const result = spawnSync('docker', [
    'run', '-d', '--name', config.name,
    '--dns', '1.1.1.1', '--dns', '1.0.0.1',
    config.image, 'sleep', 'infinity'
  ], { stdio: 'pipe' });

  if (result.status !== 0) {
    console.error(`  ✗ Failed to start container`);
    return false;
  }

  // Update package databases / setup (with a longer timeout for setup commands)
  console.log(`  Setting up environment...`);
  if (!dockerExec(config.name, config.setupCommand, 120000)) {
    console.error(`  ✗ Failed to setup environment`);
    return false;
  }

  return true;
}

// Stop and remove Docker container
function stopContainer(name: string): void {
  spawnSync('docker', ['rm', '-f', name], { stdio: 'ignore' });
}

// Setup cleanup on exit
function setupCleanup() {
  const cleanup = () => {
    console.log('\nCleaning up containers...');
    Object.values(CONTAINERS).forEach(config => stopContainer(config.name));
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);
}

// Validate script package (URL validation)
async function validateScriptPackage(pkg: Package): Promise<boolean> {
  if (!pkg.metadata?.scriptUrl) {
    return false;
  }

  const { linux, windows } = pkg.metadata.scriptUrl;
  const urls = [linux, windows].filter(Boolean);

  if (urls.length === 0) {
    return false;
  }

  // Check at least one URL is accessible
  for (const url of urls) {
    try {
      const response = await fetch(url as string, { method: 'HEAD' });
      if (response.ok) {
        return true;
      }
    } catch {
      // Try next URL
    }
  }

  return false;
}

// Validate a single package
async function validatePackage(
  source: string,
  identifier: string,
  pkg: Package,
  containerName: string
): Promise<boolean> {
  // Special handling for script packages
  if (source === 'script') {
    return validateScriptPackage(pkg);
  }

  // Special handling for AUR (uses API, no Docker needed)
  if (source === 'aur') {
    try {
      const response = await fetch(
        `https://aur.archlinux.org/rpc/v5/info?arg[]=${encodeURIComponent(identifier)}`
      );
      const data = await response.json();
      return data.resultcount === 1;
    } catch {
      return false;
    }
  }

  // Special handling for Flatpak (uses API)
  if (source === 'flatpak') {
    try {
      const response = await fetch(
        `https://flathub.org/api/v2/appstream/${encodeURIComponent(identifier)}`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  // Special handling for Snap (uses API)
  if (source === 'snap') {
    try {
      const response = await fetch(
        `https://api.snapcraft.io/v2/snaps/info/${encodeURIComponent(identifier)}`,
        {
          headers: {
            'Snap-Device-Series': '16',
          },
        }
      );
      if (!response.ok) return false;
      const data = await response.json();
      return data.name === identifier;
    } catch {
      return false;
    }
  }

  // Special handling for Homebrew (uses API)
  if (source === 'homebrew') {
    try {
      const response = await fetch(
        `https://formulae.brew.sh/api/formula/${encodeURIComponent(identifier)}.json`
      );
      if (response.ok) return true;

      // Try cask API if formula not found
      const caskResponse = await fetch(
        `https://formulae.brew.sh/api/cask/${encodeURIComponent(identifier)}.json`
      );
      return caskResponse.ok;
    } catch {
      return false;
    }
  }

  const config = CONTAINERS[source];
  if (!config) {
    return false;
  }

  return dockerExec(containerName, config.validationCommand(identifier));
}

// Validate all packages for a source
async function validateSource(
  source: string,
  packages: Package[]
): Promise<{ valid: number; total: number; skipped: boolean }> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Validating ${source} (${packages.length} packages)`);
  console.log('='.repeat(60));

  // Skip Windows-only sources
  if (SKIP_SOURCES.has(source)) {
    console.log(`  ⏭️  Skipped (Windows-only, cannot validate in Linux Docker)`);
    return { valid: 0, total: packages.length, skipped: true };
  }

  const config = CONTAINERS[source];
  let valid = 0;

  // API-based sources that don't need Docker
  const apiSources = new Set(['script', 'aur', 'flatpak', 'snap', 'homebrew']);

  // Start container (except for API-based sources)
  if (!apiSources.has(source)) {
    if (!startContainer(config)) {
      return { valid: 0, total: packages.length, skipped: false };
    }
  }

  // Validate each package
  for (const pkg of packages) {
    const isValid = await validatePackage(source, pkg.identifier, pkg, config?.name || '');

    if (isValid) {
      console.log(`  ✓ ${pkg.identifier}`);
      valid++;
    } else {
      console.log(`  ✗ ${pkg.identifier}`);
    }
  }

  // Cleanup (skip API-based sources)
  if (!apiSources.has(source) && config) {
    stopContainer(config.name);
  }

  console.log(`\nSummary: ${valid}/${packages.length} validated\n`);
  return { valid, total: packages.length, skipped: false };
}

// Print overall summary
function printOverallSummary(
  results: Record<string, { valid: number; total: number; skipped: boolean }>
) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 OVERALL SUMMARY');
  console.log('='.repeat(60));

  Object.entries(results).forEach(([source, { valid, total, skipped }]) => {
    if (skipped) {
      console.log(`⏭️  ${source.padEnd(12)} ${total} packages (skipped - Windows-only)`);
    } else {
      const percent = total > 0 ? ((valid / total) * 100).toFixed(1) : '0.0';
      const icon = valid === total ? '✅' : '⚠️';
      console.log(`${icon} ${source.padEnd(12)} ${valid}/${total} (${percent}%)`);
    }
  });

  // Calculate totals (excluding skipped)
  const validatedResults = Object.entries(results).filter(([_, r]) => !r.skipped);
  const totalValid = validatedResults.reduce((sum, [_, r]) => sum + r.valid, 0);
  const totalPackages = validatedResults.reduce((sum, [_, r]) => sum + r.total, 0);
  const overallPercent = totalPackages > 0 ? ((totalValid / totalPackages) * 100).toFixed(1) : '0.0';

  console.log('='.repeat(60));
  console.log(`Total: ${totalValid}/${totalPackages} (${overallPercent}%)\n`);
}

// Main function
async function main() {
  console.log('🐳 Docker-based Package Validation\n');

  // Parse arguments
  const args = process.argv.slice(2);
  const singleSource = args.find(arg => !arg.startsWith('--'));

  // Preflight checks
  if (!checkDockerAvailable()) {
    process.exit(2);
  }

  setupCleanup();

  const results: Record<string, { valid: number; total: number; skipped: boolean }> = {};
  const packagesDir = join(process.cwd(), 'seed/packages');

  // Get all package files
  const allFiles = readdirSync(packagesDir)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
    .sort();

  // Determine sources to validate
  const sources = singleSource ? [singleSource] : allFiles;

  // Validate single source exists
  if (singleSource && !allFiles.includes(singleSource)) {
    console.error(`❌ Unknown source: ${singleSource}`);
    console.error(`   Available sources: ${allFiles.join(', ')}`);
    process.exit(2);
  }

  // Load and validate packages for each source
  for (const source of sources) {
    const filePath = join(packagesDir, `${source}.json`);

    try {
      const packages: Package[] = JSON.parse(readFileSync(filePath, 'utf-8'));
      results[source] = await validateSource(source, packages);
    } catch (error) {
      console.error(`\n❌ Failed to validate ${source}:`);
      if (error instanceof Error) {
        console.error(`   ${error.message}`);
      }
      results[source] = { valid: 0, total: 0, skipped: false };
    }
  }

  // Print an overall summary (only if validating multiple sources)
  if (!singleSource) {
    printOverallSummary(results);
  }

  // Exit code based on validation results
  const hasFailures = Object.values(results).some(r => !r.skipped && r.valid < r.total);
  process.exit(hasFailures ? 1 : 0);
}

main();
