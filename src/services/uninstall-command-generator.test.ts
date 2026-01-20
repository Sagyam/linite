import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { generateUninstallCommands } from './uninstall-command-generator';
import type { GenerateUninstallCommandRequest } from '../types/entities';

vi.mock('@/db', () => ({
  db: {
    query: {
      distros: {
        findFirst: vi.fn(),
      },
      apps: {
        findMany: vi.fn(),
      },
    },
  },
}));

import { db } from '../db';

describe('Uninstall Command Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateUninstallCommands', () => {
    it('should generate uninstall commands for multiple apps with different sources', async () => {
      const request: GenerateUninstallCommandRequest = {
        distroSlug: 'ubuntu',
        appIds: ['app-1', 'app-2', 'app-3'],
      };

      (db.query.distros.findFirst as Mock).mockResolvedValue({
        id: 'distro-1',
        name: 'Ubuntu',
        slug: 'ubuntu',
        family: 'debian',
        distroSources: [
          {
            priority: 10,
            isDefault: true,
            source: {
              id: 'source-1',
              name: 'APT',
              slug: 'apt',
              removeCmd: 'apt remove -y',
              requireSudo: true,
              cleanupCmd: null,
              supportsDependencyCleanup: true,
              dependencyCleanupCmd: 'apt autoremove -y',
            },
          },
          {
            priority: 5,
            isDefault: false,
            source: {
              id: 'source-2',
              name: 'Flatpak',
              slug: 'flatpak',
              removeCmd: 'flatpak uninstall -y',
              requireSudo: false,
              cleanupCmd: 'flatpak remote-delete flathub',
              supportsDependencyCleanup: true,
              dependencyCleanupCmd: 'flatpak uninstall --unused -y',
            },
          },
        ],
      });

      (db.query.apps.findMany as Mock).mockResolvedValue([
        {
          id: 'app-1',
          displayName: 'Firefox',
          packages: [
            {
              id: 'pkg-1',
              identifier: 'firefox',
              sourceId: 'source-1',
              isAvailable: true,
              packageCleanupCmd: null,
              uninstallMetadata: null,
              source: {
                id: 'source-1',
                name: 'APT',
                slug: 'apt',
                removeCmd: 'apt remove -y',
                requireSudo: true,
                cleanupCmd: null,
                supportsDependencyCleanup: true,
                dependencyCleanupCmd: 'apt autoremove -y',
              },
            },
            {
              id: 'pkg-2',
              identifier: 'org.mozilla.firefox',
              sourceId: 'source-2',
              isAvailable: true,
              packageCleanupCmd: null,
              uninstallMetadata: null,
              source: {
                id: 'source-2',
                name: 'Flatpak',
                slug: 'flatpak',
                removeCmd: 'flatpak uninstall -y',
                requireSudo: false,
                cleanupCmd: 'flatpak remote-delete flathub',
                supportsDependencyCleanup: true,
                dependencyCleanupCmd: 'flatpak uninstall --unused -y',
              },
            },
          ],
        },
        {
          id: 'app-2',
          displayName: 'Git',
          packages: [
            {
              id: 'pkg-3',
              identifier: 'git',
              sourceId: 'source-1',
              isAvailable: true,
              packageCleanupCmd: null,
              uninstallMetadata: null,
              source: {
                id: 'source-1',
                name: 'APT',
                slug: 'apt',
                removeCmd: 'apt remove -y',
                requireSudo: true,
                cleanupCmd: null,
                supportsDependencyCleanup: true,
                dependencyCleanupCmd: 'apt autoremove -y',
              },
            },
          ],
        },
        {
          id: 'app-3',
          displayName: 'VLC',
          packages: [
            {
              id: 'pkg-4',
              identifier: 'org.videolan.VLC',
              sourceId: 'source-2',
              isAvailable: true,
              packageCleanupCmd: null,
              uninstallMetadata: null,
              source: {
                id: 'source-2',
                name: 'Flatpak',
                slug: 'flatpak',
                removeCmd: 'flatpak uninstall -y',
                requireSudo: false,
                cleanupCmd: 'flatpak remote-delete flathub',
                supportsDependencyCleanup: true,
                dependencyCleanupCmd: 'flatpak uninstall --unused -y',
              },
            },
          ],
        },
      ]);

      const result = await generateUninstallCommands(request);

      expect(result.commands).toHaveLength(2);
      expect(result.commands).toContain('sudo apt remove -y firefox git');
      expect(result.commands).toContain('flatpak uninstall -y org.videolan.VLC');

      expect(result.warnings).toHaveLength(0);

      expect(result.breakdown).toHaveLength(2);
      expect(result.breakdown).toContainEqual({
        source: 'APT',
        packages: ['firefox', 'git'],
      });
      expect(result.breakdown).toContainEqual({
        source: 'Flatpak',
        packages: ['org.videolan.VLC'],
      });
    });

    it('should prefer user source preference over default', async () => {
      const request: GenerateUninstallCommandRequest = {
        distroSlug: 'ubuntu',
        appIds: ['app-1'],
        sourcePreference: 'flatpak',
      };

      (db.query.distros.findFirst as Mock).mockResolvedValue({
        id: 'distro-1',
        name: 'Ubuntu',
        slug: 'ubuntu',
        family: 'debian',
        distroSources: [
          {
            priority: 10,
            isDefault: true,
            source: {
              id: 'source-1',
              name: 'APT',
              slug: 'apt',
              removeCmd: 'apt remove -y',
              requireSudo: true,
              cleanupCmd: null,
              supportsDependencyCleanup: true,
              dependencyCleanupCmd: null,
            },
          },
          {
            priority: 5,
            isDefault: false,
            source: {
              id: 'source-2',
              name: 'Flatpak',
              slug: 'flatpak',
              removeCmd: 'flatpak uninstall -y',
              requireSudo: false,
              cleanupCmd: null,
              supportsDependencyCleanup: false,
              dependencyCleanupCmd: null,
            },
          },
        ],
      });

      (db.query.apps.findMany as Mock).mockResolvedValue([
        {
          id: 'app-1',
          displayName: 'Firefox',
          packages: [
            {
              identifier: 'firefox',
              sourceId: 'source-1',
              isAvailable: true,
              packageCleanupCmd: null,
              uninstallMetadata: null,
              source: {
                id: 'source-1',
                slug: 'apt',
                name: 'APT',
                removeCmd: 'apt remove -y',
                requireSudo: true,
                cleanupCmd: null,
                supportsDependencyCleanup: true,
                dependencyCleanupCmd: null,
              },
            },
            {
              identifier: 'org.mozilla.firefox',
              sourceId: 'source-2',
              isAvailable: true,
              packageCleanupCmd: null,
              uninstallMetadata: null,
              source: {
                id: 'source-2',
                slug: 'flatpak',
                name: 'Flatpak',
                removeCmd: 'flatpak uninstall -y',
                requireSudo: false,
                cleanupCmd: null,
                supportsDependencyCleanup: false,
                dependencyCleanupCmd: null,
              },
            },
          ],
        },
      ]);

      const result = await generateUninstallCommands(request);

      expect(result.commands).toHaveLength(1);
      expect(result.commands[0]).toBe('flatpak uninstall -y org.mozilla.firefox');
      expect(result.breakdown[0].source).toBe('Flatpak');
    });

    it('should generate cleanup commands when includeSetupCleanup is true', async () => {
      const request: GenerateUninstallCommandRequest = {
        distroSlug: 'ubuntu',
        appIds: ['app-1'],
        includeSetupCleanup: true,
      };

      const flatpakCleanupCmd = 'flatpak remote-delete flathub';

      (db.query.distros.findFirst as Mock).mockResolvedValue({
        id: 'distro-1',
        name: 'Ubuntu',
        slug: 'ubuntu',
        family: 'debian',
        distroSources: [
          {
            priority: 5,
            isDefault: false,
            source: {
              id: 'source-1',
              name: 'Flatpak',
              slug: 'flatpak',
              removeCmd: 'flatpak uninstall -y',
              requireSudo: false,
              cleanupCmd: flatpakCleanupCmd,
              supportsDependencyCleanup: false,
              dependencyCleanupCmd: null,
            },
          },
        ],
      });

      (db.query.apps.findMany as Mock).mockResolvedValue([
        {
          id: 'app-1',
          displayName: 'Firefox',
          packages: [
            {
              identifier: 'org.mozilla.firefox',
              sourceId: 'source-1',
              isAvailable: true,
              packageCleanupCmd: null,
              uninstallMetadata: null,
              source: {
                id: 'source-1',
                slug: 'flatpak',
                name: 'Flatpak',
                removeCmd: 'flatpak uninstall -y',
                requireSudo: false,
                cleanupCmd: flatpakCleanupCmd,
                supportsDependencyCleanup: false,
                dependencyCleanupCmd: null,
              },
            },
          ],
        },
      ]);

      const result = await generateUninstallCommands(request);

      expect(result.cleanupCommands).toHaveLength(1);
      expect(result.cleanupCommands[0]).toBe(flatpakCleanupCmd);
    });

    it('should resolve cleanup command by distro family', async () => {
      const request: GenerateUninstallCommandRequest = {
        distroSlug: 'fedora',
        appIds: ['app-1'],
        includeSetupCleanup: true,
      };

      const fedoraCleanupCmd = 'sudo dnf copr disable user/repo';
      const ubuntuCleanupCmd = 'sudo add-apt-repository --remove ppa:user/repo';

      (db.query.distros.findFirst as Mock).mockResolvedValue({
        id: 'distro-1',
        name: 'Fedora',
        slug: 'fedora',
        family: 'rhel',
        distroSources: [
          {
            priority: 10,
            isDefault: true,
            source: {
              id: 'source-1',
              name: 'APT',
              slug: 'apt',
              removeCmd: 'apt remove -y',
              requireSudo: true,
              cleanupCmd: {
                debian: ubuntuCleanupCmd,
                rhel: fedoraCleanupCmd,
              },
              supportsDependencyCleanup: false,
              dependencyCleanupCmd: null,
            },
          },
        ],
      });

      (db.query.apps.findMany as Mock).mockResolvedValue([
        {
          id: 'app-1',
          displayName: 'Test App',
          packages: [
            {
              identifier: 'testapp',
              sourceId: 'source-1',
              isAvailable: true,
              packageCleanupCmd: null,
              uninstallMetadata: null,
              source: {
                id: 'source-1',
                slug: 'apt',
                name: 'APT',
                removeCmd: 'apt remove -y',
                requireSudo: true,
                cleanupCmd: {
                  debian: ubuntuCleanupCmd,
                  rhel: fedoraCleanupCmd,
                },
                supportsDependencyCleanup: false,
                dependencyCleanupCmd: null,
              },
            },
          ],
        },
      ]);

      const result = await generateUninstallCommands(request);

      expect(result.cleanupCommands).toHaveLength(1);
      expect(result.cleanupCommands[0]).toBe(fedoraCleanupCmd);
    });

    it('should add dependency cleanup commands when requested and supported', async () => {
      const request: GenerateUninstallCommandRequest = {
        distroSlug: 'ubuntu',
        appIds: ['app-1'],
        includeDependencyCleanup: true,
      };

      (db.query.distros.findFirst as Mock).mockResolvedValue({
        id: 'distro-1',
        name: 'Ubuntu',
        slug: 'ubuntu',
        family: 'debian',
        distroSources: [
          {
            priority: 10,
            isDefault: true,
            source: {
              id: 'source-1',
              name: 'APT',
              slug: 'apt',
              removeCmd: 'apt remove -y',
              requireSudo: true,
              cleanupCmd: null,
              supportsDependencyCleanup: true,
              dependencyCleanupCmd: 'apt autoremove -y',
            },
          },
        ],
      });

      (db.query.apps.findMany as Mock).mockResolvedValue([
        {
          id: 'app-1',
          displayName: 'Test App',
          packages: [
            {
              identifier: 'testapp',
              sourceId: 'source-1',
              isAvailable: true,
              packageCleanupCmd: null,
              uninstallMetadata: null,
              source: {
                id: 'source-1',
                slug: 'apt',
                name: 'APT',
                removeCmd: 'apt remove -y',
                requireSudo: true,
                cleanupCmd: null,
                supportsDependencyCleanup: true,
                dependencyCleanupCmd: 'apt autoremove -y',
              },
            },
          ],
        },
      ]);

      const result = await generateUninstallCommands(request);

      expect(result.dependencyCleanupCommands).toHaveLength(1);
      expect(result.dependencyCleanupCommands[0]).toBe('sudo apt autoremove -y');
    });

    it('should handle script source with uninstall metadata', async () => {
      const request: GenerateUninstallCommandRequest = {
        distroSlug: 'ubuntu',
        appIds: ['app-1'],
      };

      (db.query.distros.findFirst as Mock).mockResolvedValue({
        id: 'distro-1',
        name: 'Ubuntu',
        slug: 'ubuntu',
        family: 'debian',
        distroSources: [
          {
            priority: 1,
            isDefault: false,
            source: {
              id: 'source-1',
              name: 'Script',
              slug: 'script',
              removeCmd: null,
              requireSudo: false,
              cleanupCmd: null,
              supportsDependencyCleanup: false,
              dependencyCleanupCmd: null,
            },
          },
        ],
      });

      (db.query.apps.findMany as Mock).mockResolvedValue([
        {
          id: 'app-1',
          displayName: 'Custom App',
          packages: [
            {
              identifier: 'custom-app',
              sourceId: 'source-1',
              isAvailable: true,
              packageCleanupCmd: null,
              uninstallMetadata: JSON.stringify({
                linux: 'bash /path/to/uninstall.sh',
                windows: 'uninstall.exe',
                manualInstructions: 'Run uninstall.sh from /opt/custom-app',
              }),
              source: {
                id: 'source-1',
                slug: 'script',
                name: 'Script',
                removeCmd: null,
                requireSudo: false,
                cleanupCmd: null,
                supportsDependencyCleanup: false,
                dependencyCleanupCmd: null,
              },
            },
          ],
        },
      ]);

      const result = await generateUninstallCommands(request);

      expect(result.commands).toHaveLength(1);
      expect(result.commands[0]).toBe('bash /path/to/uninstall.sh');
      expect(result.manualSteps).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should add manual steps when script source only has manual instructions', async () => {
      const request: GenerateUninstallCommandRequest = {
        distroSlug: 'ubuntu',
        appIds: ['app-1'],
      };

      (db.query.distros.findFirst as Mock).mockResolvedValue({
        id: 'distro-1',
        name: 'Ubuntu',
        slug: 'ubuntu',
        family: 'debian',
        distroSources: [
          {
            priority: 1,
            isDefault: false,
            source: {
              id: 'source-1',
              name: 'Script',
              slug: 'script',
              removeCmd: null,
              requireSudo: false,
              cleanupCmd: null,
              supportsDependencyCleanup: false,
              dependencyCleanupCmd: null,
            },
          },
        ],
      });

      (db.query.apps.findMany as Mock).mockResolvedValue([
        {
          id: 'app-1',
          displayName: 'Custom App',
          packages: [
            {
              identifier: 'custom-app',
              sourceId: 'source-1',
              isAvailable: true,
              packageCleanupCmd: null,
              uninstallMetadata: JSON.stringify({
                manualInstructions: 'Delete /opt/custom-app and remove entry from crontab',
              }),
              source: {
                id: 'source-1',
                slug: 'script',
                name: 'Script',
                removeCmd: null,
                requireSudo: false,
                cleanupCmd: null,
                supportsDependencyCleanup: false,
                dependencyCleanupCmd: null,
              },
            },
          ],
        },
      ]);

      const result = await generateUninstallCommands(request);

      expect(result.commands).toHaveLength(0);
      expect(result.manualSteps).toHaveLength(1);
      expect(result.manualSteps[0]).toEqual({
        appName: 'Custom App',
        instructions: 'Delete /opt/custom-app and remove entry from crontab',
      });
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn for script source without uninstall metadata', async () => {
      const request: GenerateUninstallCommandRequest = {
        distroSlug: 'ubuntu',
        appIds: ['app-1'],
      };

      (db.query.distros.findFirst as Mock).mockResolvedValue({
        id: 'distro-1',
        name: 'Ubuntu',
        slug: 'ubuntu',
        family: 'debian',
        distroSources: [
          {
            priority: 1,
            isDefault: false,
            source: {
              id: 'source-1',
              name: 'Script',
              slug: 'script',
              removeCmd: null,
              requireSudo: false,
              cleanupCmd: null,
              supportsDependencyCleanup: false,
              dependencyCleanupCmd: null,
            },
          },
        ],
      });

      (db.query.apps.findMany as Mock).mockResolvedValue([
        {
          id: 'app-1',
          displayName: 'Custom App',
          packages: [
            {
              identifier: 'custom-app',
              sourceId: 'source-1',
              isAvailable: true,
              packageCleanupCmd: null,
              uninstallMetadata: null,
              source: {
                id: 'source-1',
                slug: 'script',
                name: 'Script',
                removeCmd: null,
                requireSudo: false,
                cleanupCmd: null,
                supportsDependencyCleanup: false,
                dependencyCleanupCmd: null,
              },
            },
          ],
        },
      ]);

      const result = await generateUninstallCommands(request);

      expect(result.commands).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toBe('Custom App: No uninstall metadata available for script-based installation');
    });

    it('should handle nix-env uninstall method', async () => {
      const request: GenerateUninstallCommandRequest = {
        distroSlug: 'nixos',
        appIds: ['app-1'],
        nixosInstallMethod: 'nix-env',
      };

      (db.query.distros.findFirst as Mock).mockResolvedValue({
        id: 'distro-1',
        name: 'NixOS',
        slug: 'nixos',
        family: 'nix',
        distroSources: [
          {
            priority: 10,
            isDefault: true,
            source: {
              id: 'source-1',
              name: 'Nix',
              slug: 'nix',
              removeCmd: 'nix-env -e',
              requireSudo: false,
              cleanupCmd: 'nix-collect-garbage -d',
              supportsDependencyCleanup: true,
              dependencyCleanupCmd: null,
            },
          },
        ],
      });

      (db.query.apps.findMany as Mock).mockResolvedValue([
        {
          id: 'app-1',
          displayName: 'Test App',
          packages: [
            {
              identifier: 'testapp',
              sourceId: 'source-1',
              isAvailable: true,
              packageCleanupCmd: null,
              uninstallMetadata: null,
              source: {
                id: 'source-1',
                slug: 'nix',
                name: 'Nix',
                removeCmd: 'nix-env -e',
                requireSudo: false,
                cleanupCmd: 'nix-collect-garbage -d',
                supportsDependencyCleanup: false,
                dependencyCleanupCmd: null,
              },
            },
          ],
        },
      ]);

      const result = await generateUninstallCommands(request);

      expect(result.commands).toHaveLength(1);
      expect(result.commands[0]).toBe('nix-env -e testapp');
    });

    it('should handle nix-flakes uninstall method', async () => {
      const request: GenerateUninstallCommandRequest = {
        distroSlug: 'nixos',
        appIds: ['app-1'],
        nixosInstallMethod: 'nix-flakes',
      };

      (db.query.distros.findFirst as Mock).mockResolvedValue({
        id: 'distro-1',
        name: 'NixOS',
        slug: 'nixos',
        family: 'nix',
        distroSources: [
          {
            priority: 10,
            isDefault: true,
            source: {
              id: 'source-1',
              name: 'Nix',
              slug: 'nix',
              removeCmd: 'nix-env -e',
              requireSudo: false,
              cleanupCmd: null,
              supportsDependencyCleanup: false,
              dependencyCleanupCmd: null,
            },
          },
        ],
      });

      (db.query.apps.findMany as Mock).mockResolvedValue([
        {
          id: 'app-1',
          displayName: 'Test App',
          packages: [
            {
              identifier: 'testapp',
              sourceId: 'source-1',
              isAvailable: true,
              packageCleanupCmd: null,
              uninstallMetadata: null,
              source: {
                id: 'source-1',
                slug: 'nix',
                name: 'Nix',
                removeCmd: 'nix-env -e',
                requireSudo: false,
                cleanupCmd: null,
                supportsDependencyCleanup: false,
                dependencyCleanupCmd: null,
              },
            },
          ],
        },
      ]);

      const result = await generateUninstallCommands(request);

      expect(result.commands).toHaveLength(1);
      expect(result.commands[0]).toBe('nix profile remove testapp');
    });

    it('should warn for nix-shell method (ephemeral)', async () => {
      const request: GenerateUninstallCommandRequest = {
        distroSlug: 'nixos',
        appIds: ['app-1'],
        nixosInstallMethod: 'nix-shell',
      };

      (db.query.distros.findFirst as Mock).mockResolvedValue({
        id: 'distro-1',
        name: 'NixOS',
        slug: 'nixos',
        family: 'nix',
        distroSources: [
          {
            priority: 10,
            isDefault: true,
            source: {
              id: 'source-1',
              name: 'Nix',
              slug: 'nix',
              removeCmd: 'nix-env -e',
              requireSudo: false,
              cleanupCmd: null,
              supportsDependencyCleanup: false,
              dependencyCleanupCmd: null,
            },
          },
        ],
      });

      (db.query.apps.findMany as Mock).mockResolvedValue([
        {
          id: 'app-1',
          displayName: 'Test App',
          packages: [
            {
              identifier: 'testapp',
              sourceId: 'source-1',
              isAvailable: true,
              packageCleanupCmd: null,
              uninstallMetadata: null,
              source: {
                id: 'source-1',
                slug: 'nix',
                name: 'Nix',
                removeCmd: 'nix-env -e',
                requireSudo: false,
                cleanupCmd: null,
                supportsDependencyCleanup: false,
                dependencyCleanupCmd: null,
              },
            },
          ],
        },
      ]);

      const result = await generateUninstallCommands(request);

      expect(result.commands).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toBe('nix-shell environments are ephemeral - no uninstall needed');
    });

    it('should skip sudo for sources that do not require it', async () => {
      const request: GenerateUninstallCommandRequest = {
        distroSlug: 'ubuntu',
        appIds: ['app-1'],
      };

      (db.query.distros.findFirst as Mock).mockResolvedValue({
        id: 'distro-1',
        name: 'Ubuntu',
        slug: 'ubuntu',
        family: 'debian',
        distroSources: [
          {
            priority: 5,
            isDefault: true,
            source: {
              id: 'source-1',
              name: 'Flatpak',
              slug: 'flatpak',
              removeCmd: 'flatpak uninstall -y',
              requireSudo: false,
              cleanupCmd: null,
              supportsDependencyCleanup: false,
              dependencyCleanupCmd: null,
            },
          },
        ],
      });

      (db.query.apps.findMany as Mock).mockResolvedValue([
        {
          id: 'app-1',
          displayName: 'Firefox',
          packages: [
            {
              identifier: 'org.mozilla.firefox',
              sourceId: 'source-1',
              isAvailable: true,
              packageCleanupCmd: null,
              uninstallMetadata: null,
              source: {
                id: 'source-1',
                slug: 'flatpak',
                name: 'Flatpak',
                removeCmd: 'flatpak uninstall -y',
                requireSudo: false,
                cleanupCmd: null,
                supportsDependencyCleanup: false,
                dependencyCleanupCmd: null,
              },
            },
          ],
        },
      ]);

      const result = await generateUninstallCommands(request);

      expect(result.commands).toHaveLength(1);
      expect(result.commands[0]).toBe('flatpak uninstall -y org.mozilla.firefox');
      expect(result.commands[0]).not.toContain('sudo');
    });

    it('should not add sudo prefix for Windows distro', async () => {
      const request: GenerateUninstallCommandRequest = {
        distroSlug: 'windows',
        appIds: ['app-1'],
      };

      (db.query.distros.findFirst as Mock).mockResolvedValue({
        id: 'distro-1',
        name: 'Windows',
        slug: 'windows',
        family: 'windows',
        distroSources: [
          {
            priority: 10,
            isDefault: true,
            source: {
              id: 'source-1',
              name: 'Winget',
              slug: 'winget',
              removeCmd: 'winget uninstall --silent',
              requireSudo: true,
              cleanupCmd: null,
              supportsDependencyCleanup: false,
              dependencyCleanupCmd: null,
            },
          },
        ],
      });

      (db.query.apps.findMany as Mock).mockResolvedValue([
        {
          id: 'app-1',
          displayName: 'Test App',
          packages: [
            {
              identifier: 'testapp',
              sourceId: 'source-1',
              isAvailable: true,
              packageCleanupCmd: null,
              uninstallMetadata: null,
              source: {
                id: 'source-1',
                slug: 'winget',
                name: 'Winget',
                removeCmd: 'winget uninstall --silent',
                requireSudo: true,
                cleanupCmd: null,
                supportsDependencyCleanup: false,
                dependencyCleanupCmd: null,
              },
            },
          ],
        },
      ]);

      const result = await generateUninstallCommands(request);

      expect(result.commands).toHaveLength(1);
      expect(result.commands[0]).toBe('winget uninstall --silent testapp');
      expect(result.commands[0]).not.toContain('sudo');
    });

    it('should add warning for packages with no uninstall support', async () => {
      const request: GenerateUninstallCommandRequest = {
        distroSlug: 'ubuntu',
        appIds: ['app-1'],
      };

      (db.query.distros.findFirst as Mock).mockResolvedValue({
        id: 'distro-1',
        name: 'Ubuntu',
        slug: 'ubuntu',
        family: 'debian',
        distroSources: [
          {
            priority: 10,
            isDefault: true,
            source: {
              id: 'source-1',
              name: 'Script',
              slug: 'script',
              removeCmd: null,
              requireSudo: false,
              cleanupCmd: null,
              supportsDependencyCleanup: false,
              dependencyCleanupCmd: null,
            },
          },
        ],
      });

      (db.query.apps.findMany as Mock).mockResolvedValue([
        {
          id: 'app-1',
          displayName: 'Custom App',
          packages: [
            {
              identifier: 'custom-app',
              sourceId: 'source-1',
              isAvailable: true,
              packageCleanupCmd: null,
              uninstallMetadata: null,
              source: {
                id: 'source-1',
                slug: 'script',
                name: 'Script',
                removeCmd: null,
                requireSudo: false,
                cleanupCmd: null,
                supportsDependencyCleanup: false,
                dependencyCleanupCmd: null,
              },
            },
          ],
        },
      ]);

      const result = await generateUninstallCommands(request);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('No uninstall metadata available for script-based installation');
    });

    it('should group multiple packages by source', async () => {
      const request: GenerateUninstallCommandRequest = {
        distroSlug: 'ubuntu',
        appIds: ['app-1', 'app-2', 'app-3'],
      };

      (db.query.distros.findFirst as Mock).mockResolvedValue({
        id: 'distro-1',
        name: 'Ubuntu',
        slug: 'ubuntu',
        family: 'debian',
        distroSources: [
          {
            priority: 10,
            isDefault: true,
            source: {
              id: 'source-1',
              name: 'APT',
              slug: 'apt',
              removeCmd: 'apt remove -y',
              requireSudo: true,
              cleanupCmd: null,
              supportsDependencyCleanup: true,
              dependencyCleanupCmd: null,
            },
          },
        ],
      });

      (db.query.apps.findMany as Mock).mockResolvedValue([
        {
          id: 'app-1',
          displayName: 'Git',
          packages: [
            {
              identifier: 'git',
              sourceId: 'source-1',
              isAvailable: true,
              packageCleanupCmd: null,
              uninstallMetadata: null,
              source: {
                id: 'source-1',
                slug: 'apt',
                name: 'APT',
                removeCmd: 'apt remove -y',
                requireSudo: true,
                cleanupCmd: null,
                supportsDependencyCleanup: true,
                dependencyCleanupCmd: null,
              },
            },
          ],
        },
        {
          id: 'app-2',
          displayName: 'Vim',
          packages: [
            {
              identifier: 'vim',
              sourceId: 'source-1',
              isAvailable: true,
              packageCleanupCmd: null,
              uninstallMetadata: null,
              source: {
                id: 'source-1',
                slug: 'apt',
                name: 'APT',
                removeCmd: 'apt remove -y',
                requireSudo: true,
                cleanupCmd: null,
                supportsDependencyCleanup: true,
                dependencyCleanupCmd: null,
              },
            },
          ],
        },
        {
          id: 'app-3',
          displayName: 'Curl',
          packages: [
            {
              identifier: 'curl',
              sourceId: 'source-1',
              isAvailable: true,
              packageCleanupCmd: null,
              uninstallMetadata: null,
              source: {
                id: 'source-1',
                slug: 'apt',
                name: 'APT',
                removeCmd: 'apt remove -y',
                requireSudo: true,
                cleanupCmd: null,
                supportsDependencyCleanup: true,
                dependencyCleanupCmd: null,
              },
            },
          ],
        },
      ]);

      const result = await generateUninstallCommands(request);

      expect(result.commands).toHaveLength(1);
      expect(result.commands[0]).toBe('sudo apt remove -y git vim curl');
      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0]).toEqual({
        source: 'APT',
        packages: ['git', 'vim', 'curl'],
      });
    });

    it('should deduplicate dependency cleanup commands', async () => {
      const request: GenerateUninstallCommandRequest = {
        distroSlug: 'ubuntu',
        appIds: ['app-1', 'app-2'],
        includeDependencyCleanup: true,
      };

      (db.query.distros.findFirst as Mock).mockResolvedValue({
        id: 'distro-1',
        name: 'Ubuntu',
        slug: 'ubuntu',
        family: 'debian',
        distroSources: [
          {
            priority: 10,
            isDefault: true,
            source: {
              id: 'source-1',
              name: 'APT',
              slug: 'apt',
              removeCmd: 'apt remove -y',
              requireSudo: true,
              cleanupCmd: null,
              supportsDependencyCleanup: true,
              dependencyCleanupCmd: 'apt autoremove -y',
            },
          },
        ],
      });

      (db.query.apps.findMany as Mock).mockResolvedValue([
        {
          id: 'app-1',
          displayName: 'Git',
          packages: [
            {
              identifier: 'git',
              sourceId: 'source-1',
              isAvailable: true,
              packageCleanupCmd: null,
              uninstallMetadata: null,
              source: {
                id: 'source-1',
                slug: 'apt',
                name: 'APT',
                removeCmd: 'apt remove -y',
                requireSudo: true,
                cleanupCmd: null,
                supportsDependencyCleanup: true,
                dependencyCleanupCmd: 'apt autoremove -y',
              },
            },
          ],
        },
        {
          id: 'app-2',
          displayName: 'Vim',
          packages: [
            {
              identifier: 'vim',
              sourceId: 'source-1',
              isAvailable: true,
              packageCleanupCmd: null,
              uninstallMetadata: null,
              source: {
                id: 'source-1',
                slug: 'apt',
                name: 'APT',
                removeCmd: 'apt remove -y',
                requireSudo: true,
                cleanupCmd: null,
                supportsDependencyCleanup: true,
                dependencyCleanupCmd: 'apt autoremove -y',
              },
            },
          ],
        },
      ]);

      const result = await generateUninstallCommands(request);

      expect(result.dependencyCleanupCommands).toHaveLength(1);
      expect(result.dependencyCleanupCommands[0]).toBe('sudo apt autoremove -y');
    });

    it('should throw error if distro not found', async () => {
      const request: GenerateUninstallCommandRequest = {
        distroSlug: 'non-existent',
        appIds: ['app-1'],
      };

      (db.query.distros.findFirst as Mock).mockResolvedValue(null);

      await expect(generateUninstallCommands(request)).rejects.toThrow(
        'Distribution not found. Please select a valid Linux distribution.'
      );
    });

    it('should throw error if distro has no sources configured', async () => {
      const request: GenerateUninstallCommandRequest = {
        distroSlug: 'ubuntu',
        appIds: ['app-1'],
      };

      (db.query.distros.findFirst as Mock).mockResolvedValue({
        id: 'distro-1',
        name: 'Ubuntu',
        slug: 'ubuntu',
        distroSources: [],
      });

      await expect(generateUninstallCommands(request)).rejects.toThrow(
        'No sources configured for distro "Ubuntu"'
      );
    });

    it('should throw error if no apps found', async () => {
      const request: GenerateUninstallCommandRequest = {
        distroSlug: 'ubuntu',
        appIds: ['non-existent'],
      };

      (db.query.distros.findFirst as Mock).mockResolvedValue({
        id: 'distro-1',
        name: 'Ubuntu',
        slug: 'ubuntu',
        distroSources: [
          {
            priority: 10,
            isDefault: true,
            source: {
              id: 'source-1',
              name: 'APT',
              slug: 'apt',
              removeCmd: 'apt remove -y',
              requireSudo: true,
              cleanupCmd: null,
              supportsDependencyCleanup: false,
              dependencyCleanupCmd: null,
            },
          },
        ],
      });

      (db.query.apps.findMany as Mock).mockResolvedValue([]);

      await expect(generateUninstallCommands(request)).rejects.toThrow(
        'No apps found for the provided IDs'
      );
    });
  });
});
