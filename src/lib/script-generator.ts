import type { GenerateCommandResponse, GenerateUninstallCommandResponse } from '@/types';
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
    'echo',
    'echo -e "\\033[1;36m ██╗     ██╗███╗   ██╗██╗████████╗███████╗\\033[0m"',
    'echo -e "\\033[1;36m ██║     ██║████╗  ██║██║╚══██╔══╝██╔════╝\\033[0m"',
    'echo -e "\\033[1;35m ██║     ██║██╔██╗ ██║██║   ██║   █████╗  \\033[0m"',
    'echo -e "\\033[1;34m ██║     ██║██║╚██╗██║██║   ██║   ██╔══╝  \\033[0m"',
    'echo -e "\\033[1;33m ███████╗██║██║ ╚████║██║   ██║   ███████╗\\033[0m"',
    'echo -e "\\033[1;33m ╚══════╝╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝   ╚══════╝\\033[0m"',
    'echo',
    'echo -e "\\033[1;32m 📦 Bulk Package Installer\\033[0m"',
    'echo -e "\\033[1;36m 🌐 https://linite.sagyamthapa.com.np\\033[0m"',
    'echo',
    'echo -e "\\033[1;30m═══════════════════════════════════════════════════════\\033[0m"',
    'echo',
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
    'Write-Host ""',
    'Write-Host " ██╗     ██╗███╗   ██╗██╗████████╗███████╗" -ForegroundColor Cyan',
    'Write-Host " ██║     ██║████╗  ██║██║╚══██╔══╝██╔════╝" -ForegroundColor Cyan',
    'Write-Host " ██║     ██║██╔██╗ ██║██║   ██║   █████╗  " -ForegroundColor Magenta',
    'Write-Host " ██║     ██║██║╚██╗██║██║   ██║   ██╔══╝  " -ForegroundColor Blue',
    'Write-Host " ███████╗██║██║ ╚████║██║   ██║   ███████╗" -ForegroundColor Yellow',
    'Write-Host " ╚══════╝╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝   ╚══════╝" -ForegroundColor Yellow',
    'Write-Host ""',
    'Write-Host " 📦 Bulk Package Installer" -ForegroundColor Green',
    'Write-Host " 🌐 https://linite.sagyamthapa.com.np" -ForegroundColor DarkCyan',
    'Write-Host ""',
    'Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor DarkGray',
    'Write-Host ""',
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
    'echo',
    'echo -e "\\033[1;36m ██╗     ██╗███╗   ██╗██╗████████╗███████╗\\033[0m"',
    'echo -e "\\033[1;36m ██║     ██║████╗  ██║██║╚══██╔══╝██╔════╝\\033[0m"',
    'echo -e "\\033[1;35m ██║     ██║██╔██╗ ██║██║   ██║   █████╗  \\033[0m"',
    'echo -e "\\033[1;34m ██║     ██║██║╚██╗██║██║   ██║   ██╔══╝  \\033[0m"',
    'echo -e "\\033[1;33m ███████╗██║██║ ╚████║██║   ██║   ███████╗\\033[0m"',
    'echo -e "\\033[1;33m ╚══════╝╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝   ╚══════╝\\033[0m"',
    'echo',
    'echo -e "\\033[1;31m 🗑️  Bulk Package Uninstaller\\033[0m"',
    'echo -e "\\033[1;36m 🌐 https://linite.sagyamthapa.com.np\\033[0m"',
    'echo',
    'echo -e "\\033[1;30m═══════════════════════════════════════════════════════\\033[0m"',
    'echo',
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
    'Write-Host ""',
    'Write-Host " ██╗     ██╗███╗   ██╗██╗████████╗███████╗" -ForegroundColor Cyan',
    'Write-Host " ██║     ██║████╗  ██║██║╚══██╔══╝██╔════╝" -ForegroundColor Cyan',
    'Write-Host " ██║     ██║██╔██╗ ██║██║   ██║   █████╗  " -ForegroundColor Magenta',
    'Write-Host " ██║     ██║██║╚██╗██║██║   ██║   ██╔══╝  " -ForegroundColor Blue',
    'Write-Host " ███████╗██║██║ ╚████║██║   ██║   ███████╗" -ForegroundColor Yellow',
    'Write-Host " ╚══════╝╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝   ╚══════╝" -ForegroundColor Yellow',
    'Write-Host ""',
    'Write-Host " 🗑️  Bulk Package Uninstaller" -ForegroundColor Red',
    'Write-Host " 🌐 https://linite.sagyamthapa.com.np" -ForegroundColor DarkCyan',
    'Write-Host ""',
    'Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor DarkGray',
    'Write-Host ""',
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