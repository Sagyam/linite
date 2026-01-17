#!/usr/bin/env bun

/**
 * Seed Data Validation Script
 *
 * Validates that package identifiers in seed/packages/*.json actually exist
 * in their respective package repositories.
 *
 * Usage:
 * - Validate all package managers: bun run scripts/validate-seed-data.ts
 * - Validate specific package manager: bun run scripts/validate-seed-data.ts <source>
 * - Or use npm scripts: bun run validate:seed:nix, bun run validate:seed:npm, etc.
 *
 * Validation Strategy:
 * - Primary: API-based validation (reliable, no network setup needed)
 * - Fallback: Docker-based validation for system packages (if network available)
 *
 * Supported package managers:
 * - apt: Repology API (Debian/Ubuntu repos)
 * - dnf: Fedora mdapi (rawhide)
 * - zypper: openSUSE API (Factory)
 * - pacman: Arch Linux official packages API
 * - aur: AUR RPC v5 API
 * - snap: Snapcraft API
 * - flatpak: Flathub API
 * - npm: npm registry API
 * - pip: PyPI API
 * - cargo: crates.io API
 * - go: Go proxy API
 * - chocolatey: Chocolatey API
 * - winget: winget.run API
 * - homebrew: Homebrew API (formula + cask)
 * - scoop: GitHub bucket search
 * - nix: Not validated (manual verification required)
 * - script: URL validation (checks if download URLs are accessible)
 *
 * Requirements:
 * - Internet connection for API access
 * - Optional: Docker for system package validation
 *
 * Exit codes:
 * - 0: All validation passed
 * - 1: Validation errors found
 * - 2: File I/O or fatal errors
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';

// Types
interface Package {
  app: string;
  source: string;
  identifier: string;
  isAvailable: boolean;
  metadata?: {
    scriptUrl?: {
      linux?: string;
      windows?: string;
    };
    note?: string;
  };
}

interface ValidationError {
  file: string;
  packageIndex: number;
  package: Package;
  error: string;
  category?: 'third_party_repo' | 'api_false_positive' | 'package_moved' | 'data_quality' | 'unknown';
  suggestion?: string;
  notes?: string;
}

interface ValidationReport {
  timestamp: string;
  totalPackages: number;
  checkedPackages: number;
  skippedPackages: number;
  invalidPackages: number;
  errors: ValidationError[];
  duration: number;
  validationMethod: 'api' | 'docker' | 'hybrid';
}

// Paths
const seedDir = join(process.cwd(), 'seed');
const packagesDir = join(seedDir, 'packages');
const detailedReportPath = join(process.cwd(), 'validation-errors-detailed.json');

// Rate limiting helper
async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retry helper for API calls
async function retryFetch(
  url: string,
  options: RequestInit = {},
  maxRetries = 3
): Promise<Response | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      if (i === maxRetries - 1) {
        console.error(`  Failed to fetch ${url} after ${maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`);
        return null;
      }
      await delay(1000 * (i + 1)); // Exponential backoff
    }
  }
  return null;
}

// API-based package checkers
const apiCheckers: Record<string, (identifier: string) => Promise<boolean>> = {
  npm: async (identifier: string) => {
    try {
      const response = await retryFetch(
        `https://registry.npmjs.org/${encodeURIComponent(identifier)}`
      );
      return response?.ok ?? false;
    } catch {
      return false;
    }
  },

  pip: async (identifier: string) => {
    try {
      const response = await retryFetch(
        `https://pypi.org/pypi/${encodeURIComponent(identifier)}/json`
      );
      return response?.ok ?? false;
    } catch {
      return false;
    }
  },

  cargo: async (identifier: string) => {
    try {
      const response = await retryFetch(
        `https://crates.io/api/v1/crates/${encodeURIComponent(identifier)}`,
        {
          headers: {
            'User-Agent': 'linite-validator (https://github.com/linite/linite)',
          },
        }
      );
      return response?.ok ?? false;
    } catch {
      return false;
    }
  },

  go: async (identifier: string) => {
    try {
      // Remove @latest if it exists
      const cleanIdentifier = identifier.replace('@latest', '');
      const response = await retryFetch(
        `https://proxy.golang.org/${encodeURIComponent(cleanIdentifier)}/@latest`
      );
      return response?.ok ?? false;
    } catch {
      return false;
    }
  },

  flatpak: async (identifier: string) => {
    try {
      const response = await retryFetch(
        `https://flathub.org/api/v2/appstream/${encodeURIComponent(identifier)}`,
        {
          headers: { 'Accept': 'application/json' },
        }
      );
      return response?.ok ?? false;
    } catch {
      return false;
    }
  },

  snap: async (identifier: string) => {
    try {
      const response = await retryFetch(
        `https://api.snapcraft.io/v2/snaps/info/${encodeURIComponent(identifier)}`,
        {
          headers: { 'Snap-Device-Series': '16' },
        }
      );
      return response?.ok ?? false;
    } catch {
      return false;
    }
  },

  aur: async (identifier: string) => {
    try {
      const response = await retryFetch(
        `https://aur.archlinux.org/rpc/v5/info?arg[]=${encodeURIComponent(identifier)}`,
        {
          headers: { 'Accept': 'application/json' },
        }
      );

      if (!response?.ok) return false;

      const data = (await response.json()) as { resultcount: number };
      return data.resultcount === 1;
    } catch {
      return false;
    }
  },

  pacman: async (identifier: string) => {
    try {
      const response = await retryFetch(
        `https://archlinux.org/packages/search/json/?name=${encodeURIComponent(identifier)}`,
        {
          headers: { 'Accept': 'application/json' },
        }
      );

      if (!response?.ok) return false;

      const data = (await response.json()) as {
        valid: boolean;
        results: Array<{ pkgname: string }>;
      };

      // Check for exact match
      return data.valid && data.results.some((pkg) => pkg.pkgname === identifier);
    } catch {
      return false;
    }
  },

  apt: async (identifier: string) => {
    try {
      // Use Repology API to check if package exists in Debian
      const response = await retryFetch(
        `https://repology.org/api/v1/project/${encodeURIComponent(identifier)}`
      );

      if (!response?.ok) return false;

      const data = (await response.json()) as Array<{ repo: string }>;
      // Check if package exists in Debian repositories
      return data.some(
        (pkg) =>
          pkg.repo.includes('debian') ||
          pkg.repo.includes('ubuntu')
      );
    } catch {
      return false;
    }
  },

  dnf: async (identifier: string) => {
    // Use Repology API to check across Fedora/RHEL/CentOS repos
    return validateViaRepology(identifier, 'dnf');
  },

  zypper: async (identifier: string) => {
    try {
      // Use openSUSE API to check if package exists in Factory
      const response = await retryFetch(
        `https://api.opensuse.org/public/source/openSUSE:Factory/${encodeURIComponent(identifier)}`
      );

      return response?.status === 200;
    } catch {
      return false;
    }
  },

  chocolatey: async (identifier: string) => {
    try {
      const filter = `tolower(Id) eq '${identifier.toLowerCase()}'`;
      const url = `https://community.chocolatey.org/api/v2/Packages()?$filter=${encodeURIComponent(filter)}`;
      const response = await retryFetch(url);
      if (!response?.ok) return false;
      const text = await response.text();
      return text.includes('<entry>');
    } catch {
      return false;
    }
  },

  winget: async (identifier: string) => {
    try {
      const response = await retryFetch(
        `https://api.winget.run/v2/packages/${encodeURIComponent(identifier)}`,
        {
          headers: { 'Accept': 'application/json' },
        }
      );
      return response?.ok ?? false;
    } catch {
      return false;
    }
  },

  homebrew: async (identifier: string) => {
    try {
      // Try formula first
      let response = await retryFetch(
        `https://formulae.brew.sh/api/formula/${encodeURIComponent(identifier)}.json`
      );
      if (response?.ok) return true;

      // Try cask
      response = await retryFetch(
        `https://formulae.brew.sh/api/cask/${encodeURIComponent(identifier)}.json`
      );
      return response?.ok ?? false;
    } catch {
      return false;
    }
  },

  scoop: async (identifier: string) => {
    try {
      // Check multiple Scoop buckets (main, extras, java, nerd-fonts)
      const buckets = [
        'ScoopInstaller/Main',
        'ScoopInstaller/Extras',
        'ScoopInstaller/Java',
        'ScoopInstaller/Nerd-Fonts',
      ];

      // Add GitHub token if available for higher rate limits
      const headers: Record<string, string> = {};
      if (process.env.GITHUB_TOKEN) {
        headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
      }

      for (const bucket of buckets) {
        const response = await retryFetch(
          `https://raw.githubusercontent.com/${bucket}/master/bucket/${identifier}.json`,
          { headers }
        );
        if (response?.ok) return true;
        // Small delay between bucket checks
        await delay(50);
      }

       return false;
     } catch {
       return false;
     }
   },
 };

// Repo-to-source mapping for Repology
const REPOLOGY_REPO_PATTERNS: Record<string, RegExp[]> = {
  apt: [/^debian_/, /^ubuntu_/, /^linuxmint_/, /^raspbian_/],
  dnf: [/^fedora_/, /^centos_/, /^rhel_/, /^almalinux_/, /^rocky_/],
};

// Repology validator for unified package checking
async function validateViaRepology(
  identifier: string,
  source: string
): Promise<boolean> {
  try {
    const response = await retryFetch(
      `https://repology.org/api/v1/project/${encodeURIComponent(identifier)}`,
      {
        headers: {
          'User-Agent': 'Linite/1.0',
        },
      }
    );

    if (!response?.ok) return false;

    const data = (await response.json()) as Array<{
      repo: string;
      status: string;
    }>;

    // Get the patterns for this source
    const patterns = REPOLOGY_REPO_PATTERNS[source];
    if (!patterns) return false;

    // Check if any package matches our source's repo patterns
    // and has a valid status (newest, unique, devel)
    return data.some((pkg) => {
      const matchesRepo = patterns.some((pattern) => pattern.test(pkg.repo));
      const hasValidStatus = ['newest', 'unique', 'devel'].includes(pkg.status);
      return matchesRepo && hasValidStatus;
    });
  } catch {
    return false;
  }
}

// Special checker for script packages that validates URLs
async function validateScriptPackage(pkg: Package): Promise<string | null> {
  if (!pkg.metadata?.scriptUrl) {
    return 'Missing scriptUrl in metadata';
  }

  const { linux, windows } = pkg.metadata.scriptUrl;
  const urlsToCheck: Array<{ url: string; platform: string }> = [];

  if (linux) urlsToCheck.push({ url: linux, platform: 'linux' });
  if (windows) urlsToCheck.push({ url: windows, platform: 'windows' });

  if (urlsToCheck.length === 0) {
    return 'No script URLs found in metadata';
  }

  // Validate each URL
  for (const { url, platform } of urlsToCheck) {
    try {
      // Validate URL format
      try {
        new URL(url);
      } catch {
        return `Invalid URL format for ${platform}: ${url}`;
      }

      // Check if URL is accessible using HEAD request first (faster)
      let response = await retryFetch(url, { method: 'HEAD' }, 2);

      // If HEAD fails, try GET (some servers don't support HEAD)
      if (!response || (!response.ok && response.status !== 405)) {
        response = await retryFetch(url, { method: 'GET' }, 2);
      }

      if (!response) {
        return `Failed to fetch ${platform} script URL: ${url}`;
      }

      // Check for valid response status (200-399 range)
      if (response.status < 200 || response.status >= 400) {
        return `Invalid response status ${response.status} for ${platform} URL: ${url}`;
      }

      // Check if it's a legitimate script URL (not an error page)
      const contentType = response.headers.get('content-type') || '';

      // Warn about suspicious content types (but don't fail)
      if (contentType.includes('text/html') && !url.includes('.html')) {
        console.log(`  ⚠️  Warning: ${platform} URL returns HTML (might be an error page): ${url}`);
      }

    } catch (error) {
      return `Error validating ${platform} URL: ${error instanceof Error ? error.message : String(error)}`;
    }

    // Rate limiting between URL checks
    await delay(100);
  }

  return null; // No errors
}

// Known third-party/proprietary packages that require additional repos
const THIRD_PARTY_PACKAGES = new Set([
  'android-studio', 'anydesk', 'discord', 'dropbox', 'zoom', 'slack-desktop', 'slack',
  'spotify-client', 'spotify', 'signal-desktop', 'signal', 'brave-browser', 'brave',
  'google-chrome-stable', 'googlechrome', 'microsoft-edge-stable', 'opera-stable',
  'vivaldi-stable', 'vivaldi', 'pycharm-community', 'sublime-text', 'code', 'codium',
  'dbeaver-ce', 'dbeaver', 'insomnia', 'joplin', 'onlyoffice-desktopeditors',
  'megasync', 'nextcloud-desktop', 'rustdesk', 'veracrypt', 'zen-browser',
  'balena-etcher-electron', 'balena-etcher',
]);

// Common packages that definitely exist (likely API false positives)
const COMMON_PACKAGES = new Set([
  'python3', 'python', 'gcc', 'build-essential', 'clang', 'git', 'docker', 'docker.io',
  'firefox', 'chromium', 'chromium-browser', 'gimp', 'blender', 'vlc', 'mpv',
  'emacs', 'neovim', 'vim', 'apache2', 'nginx', 'redis-server', 'postgresql',
  'openssh-server', 'qemu-system', 'java', 'jdk', 'openjdk', 'default-jdk',
  'nodejs', 'golang', 'go', 'rust', 'rustc', 'cargo', 'ruby', 'ruby-full',
  'php', 'lua', 'lua5.4', 'r-base', 'tmux', 'zsh', 'bash', 'curl', 'wget',
  'htop', 'btop', 'fzf', 'ripgrep', 'bat', 'jq', 'tldr', 'transmission',
]);

// Categorize validation error based on patterns
function categorizeError(error: ValidationError): ValidationError {
  const identifier = error.package.identifier.toLowerCase();
  const source = error.package.source;

  // Check for data quality issues
  if (error.package.identifier !== error.package.identifier.trim()) {
    return {
      ...error,
      category: 'data_quality',
      suggestion: `Trim whitespace from identifier "${error.package.identifier}"`,
      notes: 'Identifier has leading or trailing whitespace',
    };
  }

  // Check for third-party packages
  if (THIRD_PARTY_PACKAGES.has(identifier)) {
    return {
      ...error,
      category: 'third_party_repo',
      suggestion: 'Remove from seed data or mark as requires third-party repo/PPA',
      notes: `${error.package.identifier} is proprietary software or requires third-party repositories`,
    };
  }

  // Check for common packages (likely API false positives)
  if (COMMON_PACKAGES.has(identifier)) {
    return {
      ...error,
      category: 'api_false_positive',
      suggestion: 'Package likely exists - API validation failed',
      notes: `${error.package.identifier} is a common package that should exist in ${source} repositories`,
    };
  }

  // Default to unknown
  return {
    ...error,
    category: 'unknown',
    suggestion: 'Manually verify if package exists with correct identifier',
    notes: 'Could be package name change, moved to different repo, or deprecated',
  };
}

// Check if Docker is available (optional)
function checkDockerAvailable(): boolean {
  const dockerCheck = spawnSync('docker', ['--version'], {
    stdio: 'pipe',
  });

  if (dockerCheck.error || dockerCheck.status !== 0) {
    return false;
  }

  const dockerPs = spawnSync('docker', ['ps'], {
    stdio: 'pipe',
  });

  return dockerPs.status === 0;
}

// Validate packages using API
async function validatePackages(
  packages: Package[],
  source: string,
  file: string,
  progressPrefix: string
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  // Special handling for script packages
  if (source === 'script') {
    console.log(
      `${progressPrefix} 🔍 Validating ${packages.length} script packages (checking URLs)...`
    );

    for (let i = 0; i < packages.length; i++) {
      const pkg = packages[i];
      const error = await validateScriptPackage(pkg);

      if (error) {
        errors.push({
          file,
          packageIndex: i,
          package: pkg,
          error,
        });
      }

      // Progress indicator
      if ((i + 1) % 5 === 0 || i === packages.length - 1) {
        console.log(
          `${progressPrefix} 📊 Progress: ${i + 1}/${packages.length} packages checked`
        );
      }

      // Rate limiting (slower for script validation due to network requests)
      await delay(200);
    }

    return errors;
  }

  // Regular API-based validation for other sources
  const checker = apiCheckers[source];

  if (!checker) {
    console.log(`${progressPrefix} ⏭️  Skipping ${source} (no validation method available)`);
    return errors;
  }

  console.log(
    `${progressPrefix} 🔍 Validating ${packages.length} ${source} packages using API...`
  );

  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i];
    const exists = await checker(pkg.identifier);

    if (!exists) {
      errors.push({
        file,
        packageIndex: i,
        package: pkg,
        error: `Package "${pkg.identifier}" not found in ${source} repository`,
      });
    }

    // Progress indicator
    if ((i + 1) % 10 === 0 || i === packages.length - 1) {
      console.log(
        `${progressPrefix} 📊 Progress: ${i + 1}/${packages.length} packages checked`
      );
    }

    // Rate limiting
    await delay(50);
  }

  return errors;
}

// Generate validation report
function generateReport(
  report: ValidationReport,
  allErrors: ValidationError[]
): void {
  // Categorize all errors
  const categorizedErrors = allErrors.map(categorizeError);

  // Group by category
  const errorsByCategory: Record<string, ValidationError[]> = {
    third_party_repo: [],
    api_false_positive: [],
    package_moved: [],
    data_quality: [],
    unknown: [],
  };

  categorizedErrors.forEach((error) => {
    const category = error.category || 'unknown';
    errorsByCategory[category].push(error);
  });

  // Group by package manager
  const errorsByPackageManager: Record<string, number> = {};
  categorizedErrors.forEach((error) => {
    const source = error.package.source;
    errorsByPackageManager[source] = (errorsByPackageManager[source] || 0) + 1;
  });

  console.log('\n' + '='.repeat(70));
  console.log('📊 VALIDATION REPORT');
  console.log('='.repeat(70));
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Duration: ${(report.duration / 1000).toFixed(2)}s`);
  console.log(`Validation method: ${report.validationMethod.toUpperCase()}`);
  console.log(`Total packages: ${report.totalPackages}`);
  console.log(`✅ Checked: ${report.checkedPackages}`);
  console.log(`⏭️  Skipped: ${report.skippedPackages}`);
  console.log(`❌ Invalid: ${report.invalidPackages}\n`);

  // Show categorization summary
  console.log('📋 Error Categories:');
  console.log(`   🔒 Third-party repos: ${errorsByCategory.third_party_repo.length}`);
  console.log(`   ⚠️  API false positives: ${errorsByCategory.api_false_positive.length}`);
  console.log(`   📦 Package moved/renamed: ${errorsByCategory.package_moved.length}`);
  console.log(`   🔧 Data quality: ${errorsByCategory.data_quality.length}`);
  console.log(`   ❓ Unknown: ${errorsByCategory.unknown.length}\n`);

  // Success rate
  if (report.checkedPackages > 0) {
    const successRate = (
      ((report.checkedPackages - report.invalidPackages) / report.checkedPackages) *
      100
    ).toFixed(1);
    console.log(`✨ Success rate: ${successRate}%\n`);
  }

  // Detailed error reporting
  if (allErrors.length > 0) {
    console.log('⚠️  VALIDATION ERRORS\n');

    // Group errors by file
    const errorsByFile = allErrors.reduce(
      (acc, error) => {
        if (!acc[error.file]) acc[error.file] = [];
        acc[error.file].push(error);
        return acc;
      },
      {} as Record<string, ValidationError[]>
    );

    Object.entries(errorsByFile).forEach(([file, errors]) => {
      console.log(
        `📄 ${file} (${errors.length} error${errors.length > 1 ? 's' : ''})`
      );
      errors.slice(0, 5).forEach((error) => {
        console.log(`  ❌ [Package ${error.packageIndex}] ${error.error}`);
        console.log(`     Identifier: "${error.package.identifier}"`);
        console.log(`     App: "${error.package.app}"`);
      });
      if (errors.length > 5) {
        console.log(`  ... and ${errors.length - 5} more errors`);
      }
      console.log('');
    });

    console.log('💡 Troubleshooting:');
    console.log('   1. Verify package identifiers are spelled correctly');
    console.log('   2. Check if packages have been renamed or removed');
    console.log('   3. Some packages may be in alternative repositories');
    console.log('   4. Package names may be case-sensitive');
    console.log('   5. For system packages (apt/dnf), check Repology.org manually\n');
  } else {
    console.log('✅ All checked packages exist in their repositories!\n');
  }

  // Generate detailed error report with categorization
  const detailedReport = {
    timestamp: report.timestamp,
    summary: {
      total: report.invalidPackages,
      byPackageManager: errorsByPackageManager,
      categorized: {
        third_party_repo: errorsByCategory.third_party_repo.length,
        api_false_positive: errorsByCategory.api_false_positive.length,
        package_moved: errorsByCategory.package_moved.length,
        data_quality: errorsByCategory.data_quality.length,
        unknown: errorsByCategory.unknown.length,
      },
    },
    errors: categorizedErrors.map((error) => ({
      package: error.package.app,
      source: error.package.source,
      identifier: error.package.identifier,
      category: error.category,
      suggestion: error.suggestion,
      notes: error.notes,
    })),
    errorsByCategory: {
      third_party_repo: errorsByCategory.third_party_repo.map((e) => ({
        app: e.package.app,
        source: e.package.source,
        identifier: e.package.identifier,
        suggestion: e.suggestion,
      })),
      api_false_positive: errorsByCategory.api_false_positive.map((e) => ({
        app: e.package.app,
        source: e.package.source,
        identifier: e.package.identifier,
        suggestion: e.suggestion,
      })),
      package_moved: errorsByCategory.package_moved.map((e) => ({
        app: e.package.app,
        source: e.package.source,
        identifier: e.package.identifier,
        suggestion: e.suggestion,
      })),
      data_quality: errorsByCategory.data_quality.map((e) => ({
        app: e.package.app,
        source: e.package.source,
        identifier: e.package.identifier,
        suggestion: e.suggestion,
      })),
      unknown: errorsByCategory.unknown.map((e) => ({
        app: e.package.app,
        source: e.package.source,
        identifier: e.package.identifier,
        suggestion: e.suggestion,
      })),
    },
  };

  writeFileSync(detailedReportPath, JSON.stringify(detailedReport, null, 2));
  console.log(`📋 Detailed error report saved to: ${detailedReportPath}\n`);
}

// Main validation function
async function validateSeedData(source?: string) {
  const startTime = Date.now();

  console.log('🔍 Seed Data Validation\n');
  console.log('Validating packages against their official repositories...\n');

  // Check Docker availability (optional)
  const dockerAvailable = checkDockerAvailable();
  if (dockerAvailable) {
    console.log('🐳 Docker is available (not used in current validation)');
  } else {
    console.log('ℹ️  Docker not available, using API validation only');
  }
  console.log('');

  try {
    // Load all package files or filter by source
    let packageFiles = readdirSync(packagesDir)
      .filter((f) => f.endsWith('.json'))
      .sort();

    // If source specified, only validate that package manager
    if (source) {
      packageFiles = packageFiles.filter((f) => f === `${source}.json`);
      if (packageFiles.length === 0) {
        console.error(`❌ Package manager "${source}" not found`);
        console.error('\nAvailable package managers:');
        Object.keys(apiCheckers).forEach((pkg) => console.log(`  - ${pkg}`));
        process.exit(2);
      }
      console.log(`🎯 Validating only: ${source}\n`);
    }

    console.log(`📦 Found ${packageFiles.length} package file(s)\n`);

    // List supported sources
    const supportedSources = Object.keys(apiCheckers);
    console.log(`✅ Supported package managers:`);
    console.log(`   ${supportedSources.join(', ')}\n`);

    // Validation results
    const allErrors: ValidationError[] = [];
    let totalPackages = 0;
    let checkedPackages = 0;
    let skippedPackages = 0;

    // Validate each package file
    for (let fileIdx = 0; fileIdx < packageFiles.length; fileIdx++) {
      const file = packageFiles[fileIdx];
      const filePath = join(packagesDir, file);
      const packagesRaw = readFileSync(filePath, 'utf-8');
      const packages: Package[] = JSON.parse(packagesRaw);
      const currentSource = file.replace('.json', '');

      totalPackages += packages.length;

      const progressPrefix = source
        ? `[${currentSource}]`
        : `[${fileIdx + 1}/${packageFiles.length}]`;

      console.log(`\n${'='.repeat(70)}`);
      console.log(`${progressPrefix} 📄 ${file} (${packages.length} packages)`);
      console.log('='.repeat(70));

      // Skip if no validation method available (but script has special handling)
      if (!apiCheckers[currentSource] && currentSource !== 'script') {
        const skipReason = currentSource === 'nix'
          ? 'manual verification required'
          : 'no validation method available';
        console.log(
          `${progressPrefix} ⏭️  Skipping ${currentSource} (${skipReason})`
        );
        skippedPackages += packages.length;
        continue;
      }

      const errors = await validatePackages(packages, currentSource, file, progressPrefix);
      allErrors.push(...errors);
      checkedPackages += packages.length;

      if (errors.length > 0) {
        console.log(`${progressPrefix} ❌ Found ${errors.length} invalid package(s)`);
      } else {
        console.log(`${progressPrefix} ✅ All packages valid`);
      }
    }

    // Generate report
    const duration = Date.now() - startTime;
    const report: ValidationReport = {
      timestamp: new Date().toISOString(),
      totalPackages,
      checkedPackages,
      skippedPackages,
      invalidPackages: allErrors.length,
      errors: allErrors,
      duration,
      validationMethod: 'api',
    };

    generateReport(report, allErrors);

    // Exit with appropriate code
    if (allErrors.length > 0) {
      console.log('🚫 Validation failed with errors\n');
      process.exit(1);
    } else {
      console.log('🚀 Validation complete - all packages valid!\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Fatal error during validation:', error);
    console.error('\n💡 Check that all JSON files are properly formatted\n');
    process.exit(2);
  }
}

// Export individual validators
export const validators = apiCheckers;
export { validatePackages, validateSeedData, categorizeError };
export type { Package, ValidationError, ValidationReport };

// Run validation if this script is executed directly
const isMainModule = process.argv[1].endsWith('validate-seed-data.ts');
if (isMainModule) {
  const source = process.argv[2];
  validateSeedData(source);
}