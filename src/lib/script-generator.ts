import type { GenerateCommandResponse, GenerateUninstallCommandResponse } from '@/types';
import { APP_WEBSITE_URL } from '@/lib/constants';

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