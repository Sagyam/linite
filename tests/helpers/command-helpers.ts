/**
 * Command Helpers - Utilities for validating install/uninstall commands
 *
 * These helpers provide functions to validate the correctness of
 * generated install and uninstall commands for different package managers
 * and sources.
 */

export class CommandHelpers {
  /**
   * Validate APT command syntax
   * @param command - The command to validate
   * @returns true if valid, false otherwise
   */
  static validateAptCommand(command: string): boolean {
    // APT commands should start with sudo apt install or apt-get install
    const aptPattern = /^sudo\s+(apt|apt-get)\s+(install|remove|purge)/;
    return aptPattern.test(command.trim());
  }

  /**
   * Validate DNF command syntax
   * @param command - The command to validate
   * @returns true if valid, false otherwise
   */
  static validateDnfCommand(command: string): boolean {
    const dnfPattern = /^sudo\s+dnf\s+(install|remove)/;
    return dnfPattern.test(command.trim());
  }

  /**
   * Validate Pacman command syntax
   * @param command - The command to validate
   * @returns true if valid, false otherwise
   */
  static validatePacmanCommand(command: string): boolean {
    const pacmanPattern = /^sudo\s+pacman\s+-S(u)?/;
    return pacmanPattern.test(command.trim());
  }

  /**
   * Validate Flatpak command syntax
   * @param command - The command to validate
   * @returns true if valid, false otherwise
   */
  static validateFlatpakCommand(command: string): boolean {
    const flatpakPattern = /^flatpak\s+(install|uninstall|remove)/;
    return flatpakPattern.test(command.trim());
  }

  /**
   * Validate Snap command syntax
   * @param command - The command to validate
   * @returns true if valid, false otherwise
   */
  static validateSnapCommand(command: string): boolean {
    const snapPattern = /^sudo\s+snap\s+(install|remove)/;
    return snapPattern.test(command.trim());
  }

  /**
   * Validate Homebrew command syntax
   * @param command - The command to validate
   * @returns true if valid, false otherwise
   */
  static validateBrewCommand(command: string): boolean {
    const brewPattern = /^brew\s+(install|uninstall|remove)/;
    return brewPattern.test(command.trim());
  }

  /**
   * Validate Nix command syntax
   * @param command - The command to validate
   * @returns true if valid, false otherwise
   */
  static validateNixCommand(command: string): boolean {
    const nixPattern = /^nix(-env)?\s+(--install|-i|profile\s+install)/;
    return nixPattern.test(command.trim());
  }

  /**
   * Validate Winget command syntax
   * @param command - The command to validate
   * @returns true if valid, false otherwise
   */
  static validateWingetCommand(command: string): boolean {
    const wingetPattern = /^winget\s+(install|uninstall)/;
    return wingetPattern.test(command.trim());
  }

  /**
   * Validate command based on source type
   * @param command - The command to validate
   * @param source - Source slug (apt, dnf, flatpak, etc.)
   * @returns true if valid, false otherwise
   */
  static validateCommand(command: string, source: string): boolean {
    switch (source.toLowerCase()) {
      case 'apt':
      case 'apt-get':
        return this.validateAptCommand(command);
      case 'dnf':
      case 'yum':
        return this.validateDnfCommand(command);
      case 'pacman':
        return this.validatePacmanCommand(command);
      case 'flatpak':
        return this.validateFlatpakCommand(command);
      case 'snap':
        return this.validateSnapCommand(command);
      case 'brew':
      case 'homebrew':
        return this.validateBrewCommand(command);
      case 'nix':
      case 'nixpkgs':
        return this.validateNixCommand(command);
      case 'winget':
        return this.validateWingetCommand(command);
      default:
        console.warn(`Unknown source type: ${source}`);
        return false;
    }
  }

  /**
   * Extract package names from an install command
   * @param command - The install command
   * @returns Array of package names
   */
  static extractPackageNames(command: string): string[] {
    // Remove sudo, package manager, and flags
    const cleaned = command
      .replace(/^sudo\s+/, '')
      .replace(/^(apt|apt-get|dnf|yum|pacman|flatpak|snap|brew|nix-env|winget)\s+/, '')
      .replace(/^(install|remove|uninstall|-S|-i|--install)\s+/, '')
      .replace(/\s+-[a-zA-Z]+/g, '') // Remove flags like -y
      .trim();

    // Split by whitespace to get individual packages
    return cleaned.split(/\s+/).filter((pkg) => pkg.length > 0);
  }

  /**
   * Check if command contains specific package
   * @param command - The install command
   * @param packageName - Package name to check for
   * @returns true if package is in command
   */
  static containsPackage(command: string, packageName: string): boolean {
    const packages = this.extractPackageNames(command);
    return packages.some((pkg) => pkg.includes(packageName));
  }

  /**
   * Validate setup command (e.g., add PPA, enable repository)
   * @param command - The setup command
   * @returns true if valid setup command
   */
  static isValidSetupCommand(command: string): boolean {
    // Common setup command patterns
    const setupPatterns = [
      /^sudo\s+add-apt-repository/, // PPA
      /^sudo\s+dnf\s+config-manager/, // DNF config
      /^flatpak\s+remote-add/, // Flatpak remote
      /^sudo\s+rpm\s+--import/, // RPM key import
      /^sudo\s+apt-key\s+add/, // APT key
    ];

    return setupPatterns.some((pattern) => pattern.test(command.trim()));
  }

  /**
   * Get expected command prefix for a source
   * @param source - Source slug
   * @returns Expected command prefix
   */
  static getCommandPrefix(source: string): string {
    const prefixes: Record<string, string> = {
      apt: 'sudo apt install',
      'apt-get': 'sudo apt-get install',
      dnf: 'sudo dnf install',
      yum: 'sudo yum install',
      pacman: 'sudo pacman -S',
      flatpak: 'flatpak install',
      snap: 'sudo snap install',
      brew: 'brew install',
      homebrew: 'brew install',
      nix: 'nix-env -i',
      nixpkgs: 'nix profile install',
      winget: 'winget install',
    };

    return prefixes[source.toLowerCase()] || '';
  }

  /**
   * Validate that command has no-confirm flag (for automated installs)
   * @param command - The install command
   * @param source - Source slug
   * @returns true if has no-confirm flag
   */
  static hasNoConfirmFlag(command: string, source: string): boolean {
    const flags: Record<string, RegExp> = {
      apt: /-y|--yes/,
      dnf: /-y|--assumeyes/,
      pacman: /--noconfirm/,
      flatpak: /-y|--assumeyes/,
      snap: /--yes/,
    };

    const flagPattern = flags[source.toLowerCase()];
    return flagPattern ? flagPattern.test(command) : true;
  }

  /**
   * Parse command into components
   * @param command - The command to parse
   * @returns Object with command components
   */
  static parseCommand(command: string): {
    sudo: boolean;
    packageManager: string;
    action: string;
    flags: string[];
    packages: string[];
  } {
    const parts = command.trim().split(/\s+/);
    const sudo = parts[0] === 'sudo';
    const packageManager = sudo ? parts[1] : parts[0];
    const action = sudo ? parts[2] : parts[1];

    const flags: string[] = [];
    const packages: string[] = [];

    const startIndex = sudo ? 3 : 2;
    for (let i = startIndex; i < parts.length; i++) {
      if (parts[i].startsWith('-')) {
        flags.push(parts[i]);
      } else {
        packages.push(parts[i]);
      }
    }

    return {
      sudo,
      packageManager,
      action,
      flags,
      packages,
    };
  }

  /**
   * Compare two commands for equality (ignoring flags order)
   * @param command1 - First command
   * @param command2 - Second command
   * @returns true if commands are equivalent
   */
  static commandsEqual(command1: string, command2: string): boolean {
    const parsed1 = this.parseCommand(command1);
    const parsed2 = this.parseCommand(command2);

    return (
      parsed1.sudo === parsed2.sudo &&
      parsed1.packageManager === parsed2.packageManager &&
      parsed1.action === parsed2.action &&
      JSON.stringify(parsed1.packages.sort()) ===
        JSON.stringify(parsed2.packages.sort()) &&
      JSON.stringify(parsed1.flags.sort()) ===
        JSON.stringify(parsed2.flags.sort())
    );
  }

  /**
   * Validate uninstall command
   * @param command - The uninstall command
   * @param source - Source slug
   * @returns true if valid uninstall command
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static validateUninstallCommand(command: string, _source: string): boolean {
    const uninstallActions = ['remove', 'uninstall', 'purge', '-R'];
    const parsed = this.parseCommand(command);

    return uninstallActions.some((action) =>
      parsed.action.toLowerCase().includes(action.toLowerCase())
    );
  }
}
