import type { GenerateCommandResponse, GenerateUninstallCommandResponse, PackageBreakdown } from '@/types';
import { APP_WEBSITE_URL } from '@/lib/constants';

/**
 * Mapping of source slugs to their verification commands
 * Each source has a specific way to verify if a package was installed successfully
 */
const VERIFICATION_COMMANDS: Record<string, (pkg: string) => string> = {
  flatpak: (pkg) => `flatpak info ${pkg} >/dev/null 2>&1`,
  snap: (pkg) => `snap list ${pkg} >/dev/null 2>&1`,
  apt: (pkg) => `dpkg -l ${pkg} 2>/dev/null | grep -q "^ii"`,
  dnf: (pkg) => `rpm -q ${pkg} >/dev/null 2>&1`,
  pacman: (pkg) => `pacman -Q ${pkg} >/dev/null 2>&1`,
  aur: (pkg) => `pacman -Q ${pkg} >/dev/null 2>&1`,
  zypper: (pkg) => `rpm -q ${pkg} >/dev/null 2>&1`,
  homebrew: (pkg) => `brew list ${pkg} >/dev/null 2>&1`,
  nix: (pkg) => `nix-env -q ${pkg} >/dev/null 2>&1`,
  cargo: (pkg) => `cargo install --list | grep -q "^${pkg}"`,
  npm: (pkg) => `npm list -g ${pkg} >/dev/null 2>&1`,
  pip: (pkg) => `pip show ${pkg} >/dev/null 2>&1`,
  go: (pkg) => `which ${pkg.split('/').pop()} >/dev/null 2>&1`,
};

/**
 * Generate verification commands for installed packages
 */
function generateVerificationCommands(breakdown: PackageBreakdown[]): string[] {
  const lines: string[] = [
    '',
    '# ============================================================================',
    '# Verification: Checking installed packages',
    '# ============================================================================',
    'echo',
    'echo -e "\\033[1;36m🔍 Verifying installations...\\033[0m"',
    'echo',
    'INSTALL_SUCCESS=0',
    'INSTALL_FAILED=0',
    '',
  ];

  for (const item of breakdown) {
    const sourceSlug = item.source.toLowerCase();
    const verifyFn = VERIFICATION_COMMANDS[sourceSlug];

    for (const pkg of item.packages) {
      if (verifyFn) {
        lines.push(
          `if ${verifyFn(pkg)}; then`,
          `  echo -e "  \\033[1;32m✓\\033[0m ${pkg} (${item.source})"`,
          '  ((INSTALL_SUCCESS++))',
          'else',
          `  echo -e "  \\033[1;31m✗\\033[0m ${pkg} (${item.source}) - Not found or failed"`,
          '  ((INSTALL_FAILED++))',
          'fi'
        );
      } else {
        // For sources without verification (like script), just report as installed
        lines.push(
          `echo -e "  \\033[1;33m?\\033[0m ${pkg} (${item.source}) - Manual verification required"`
        );
      }
    }
  }

  lines.push(
    '',
    'echo',
    'echo -e "\\033[1;30m═══════════════════════════════════════════════════════\\033[0m"',
    'echo -e "\\033[1;36m📊 Summary: \\033[1;32m$INSTALL_SUCCESS succeeded\\033[0m, \\033[1;31m$INSTALL_FAILED failed\\033[0m"',
    '',
    'if [ $INSTALL_FAILED -gt 0 ]; then',
    '  echo -e "\\033[1;33m⚠️  Some packages failed to install. You may need to restart your terminal or log out and back in.\\033[0m"',
    'fi',
    'echo'
  );

  return lines;
}

/**
 * Generate Linux/Unix bash banner with colorful ASCII art
 */
function generateLinuxBanner(subtitle: string, subtitleColor: string = '\\033[1;32m'): string[] {
  return [
    'echo',
    'echo -e "\\033[1;36m ██╗     ██╗███╗   ██╗██╗████████╗███████╗\\033[0m"',
    'echo -e "\\033[1;36m ██║     ██║████╗  ██║██║╚══██╔══╝██╔════╝\\033[0m"',
    'echo -e "\\033[1;35m ██║     ██║██╔██╗ ██║██║   ██║   █████╗  \\033[0m"',
    'echo -e "\\033[1;34m ██║     ██║██║╚██╗██║██║   ██║   ██╔══╝  \\033[0m"',
    'echo -e "\\033[1;33m ███████╗██║██║ ╚████║██║   ██║   ███████╗\\033[0m"',
    'echo -e "\\033[1;33m ╚══════╝╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝   ╚══════╝\\033[0m"',
    'echo',
    `echo -e "${subtitleColor} ${subtitle}\\033[0m"`,
    `echo -e "\\033[1;36m 🌐 ${APP_WEBSITE_URL}\\033[0m"`,
    'echo',
    'echo -e "\\033[1;30m═══════════════════════════════════════════════════════\\033[0m"',
    'echo',
  ];
}

/**
 * Generate Windows PowerShell banner with colorful ASCII art
 */
function generateWindowsBanner(subtitle: string, subtitleColor: string = 'Green'): string[] {
  return [
    'Write-Host ""',
    'Write-Host " ██╗     ██╗███╗   ██╗██╗████████╗███████╗" -ForegroundColor Cyan',
    'Write-Host " ██║     ██║████╗  ██║██║╚══██╔══╝██╔════╝" -ForegroundColor Cyan',
    'Write-Host " ██║     ██║██╔██╗ ██║██║   ██║   █████╗  " -ForegroundColor Magenta',
    'Write-Host " ██║     ██║██║╚██╗██║██║   ██║   ██╔══╝  " -ForegroundColor Blue',
    'Write-Host " ███████╗██║██║ ╚████║██║   ██║   ███████╗" -ForegroundColor Yellow',
    'Write-Host " ╚══════╝╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝   ╚══════╝" -ForegroundColor Yellow',
    'Write-Host ""',
    `Write-Host " ${subtitle}" -ForegroundColor ${subtitleColor}`,
    `Write-Host " 🌐 ${APP_WEBSITE_URL}" -ForegroundColor DarkCyan`,
    'Write-Host ""',
    'Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor DarkGray',
    'Write-Host ""',
  ];
}

/**
 * Generate a Linux/Unix bash install script
 */
export function generateLinuxInstallScript(
  distro: string,
  result: GenerateCommandResponse
): { content: string; filename: string } {
  const isNixOS = distro === 'nixos';
  const shebang = isNixOS ? '#!/run/current-system/sw/bin/bash' : '#!/bin/bash';

  const content = [
    shebang,
    '',
    '# Display colorful LINITE ASCII art banner',
    ...generateLinuxBanner('📦 Bulk Package Installer'),
    '',
    ...(result.setupCommands || []),
    '',
    ...result.commands,
    '',
    ...generateVerificationCommands(result.breakdown),
  ].join('\n');

  return {
    content,
    filename: 'linite-install.sh',
  };
}

/**
 * Generate a Windows PowerShell install script with colorful LINITE ASCII art
 */
export function generateWindowsInstallScript(
  result: GenerateCommandResponse
): { content: string; filename: string } {
  const content = [
    '# Linite - Bulk Package Installer',
    '',
    '# Display colorful LINITE ASCII art banner',
    ...generateWindowsBanner('📦 Bulk Package Installer'),
    '',
    ...(result.setupCommands || []),
    '',
    ...result.commands,
  ].join('\n');

  return {
    content,
    filename: 'linite-install.ps1',
  };
}

/**
 * Generate a Linux/Unix bash uninstall script
 */
export function generateLinuxUninstallScript(
  distro: string,
  result: GenerateUninstallCommandResponse
): { content: string; filename: string } {
  const isNixOS = distro === 'nixos';
  const shebang = isNixOS ? '#!/run/current-system/sw/bin/bash' : '#!/bin/bash';

  const content = [
    shebang,
    '',
    '# Display colorful LINITE ASCII art banner',
    ...generateLinuxBanner('🗑️  Bulk Package Uninstaller', '\\033[1;31m'),
    '',
    ...(result.cleanupCommands || []),
    '',
    ...result.commands,
    '',
    ...(result.dependencyCleanupCommands || []),
  ].join('\n');

  return {
    content,
    filename: 'linite-uninstall.sh',
  };
}

/**
 * Generate a Windows PowerShell uninstall script with colorful LINITE ASCII art
 */
export function generateWindowsUninstallScript(
  result: GenerateUninstallCommandResponse
): { content: string; filename: string } {
  const content = [
    '# Linite - Bulk Package Uninstaller',
    '',
    '# Display colorful LINITE ASCII art banner',
    ...generateWindowsBanner('🗑️  Bulk Package Uninstaller', 'Red'),
    '',
    ...(result.cleanupCommands || []),
    '',
    ...result.commands,
    '',
    ...(result.dependencyCleanupCommands || []),
  ].join('\n');

  return {
    content,
    filename: 'linite-uninstall.ps1',
  };
}

/**
 * Helper function to download a script file
 */
export function downloadScript(content: string, filename: string, ): void {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}