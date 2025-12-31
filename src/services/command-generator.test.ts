import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { generateInstallCommands } from './command-generator';
import type { GenerateCommandRequest } from '@/types/entities';

// Mock the database
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

import { db } from '@/db';

describe('Command Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateInstallCommands', () => {
    it('should generate commands for multiple apps with different sources', async () => {
      const request: GenerateCommandRequest = {
        distroSlug: 'ubuntu',
        appIds: ['app-1', 'app-2', 'app-3'],
      };

      // Mock distro with APT and Flatpak sources
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
              installCmd: 'apt install -y',
              requireSudo: true,
              setupCmd: null,
              priority: 10,
            },
          },
          {
            priority: 5,
            isDefault: false,
            source: {
              id: 'source-2',
              name: 'Flatpak',
              slug: 'flatpak',
              installCmd: 'flatpak install -y flathub',
              requireSudo: false,
              setupCmd: 'flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo',
              priority: 5,
            },
          },
        ],
      });

      // Mock apps with packages
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
              source: {
                id: 'source-1',
                name: 'APT',
                slug: 'apt',
                installCmd: 'apt install -y',
                requireSudo: true,
                setupCmd: null,
              },
            },
            {
              id: 'pkg-2',
              identifier: 'org.mozilla.firefox',
              sourceId: 'source-2',
              isAvailable: true,
              source: {
                id: 'source-2',
                name: 'Flatpak',
                slug: 'flatpak',
                installCmd: 'flatpak install -y flathub',
                requireSudo: false,
                setupCmd: 'flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo',
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
              source: {
                id: 'source-1',
                name: 'APT',
                slug: 'apt',
                installCmd: 'apt install -y',
                requireSudo: true,
                setupCmd: null,
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
              source: {
                id: 'source-2',
                name: 'Flatpak',
                slug: 'flatpak',
                installCmd: 'flatpak install -y flathub',
                requireSudo: false,
                setupCmd: 'flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo',
              },
            },
          ],
        },
      ]);

      const result = await generateInstallCommands(request);

      expect(result.commands).toHaveLength(2);
      expect(result.commands).toContain('sudo apt install -y firefox git');
      expect(result.commands).toContain('flatpak install -y flathub org.videolan.VLC');

      expect(result.setupCommands).toHaveLength(1);
      expect(result.setupCommands[0]).toContain('flatpak remote-add');

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
      const request: GenerateCommandRequest = {
        distroSlug: 'ubuntu',
        appIds: ['app-1'],
        sourcePreference: 'flatpak',
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
              installCmd: 'apt install -y',
              requireSudo: true,
              setupCmd: null,
            },
          },
          {
            priority: 5,
            isDefault: false,
            source: {
              id: 'source-2',
              name: 'Flatpak',
              slug: 'flatpak',
              installCmd: 'flatpak install -y flathub',
              requireSudo: false,
              setupCmd: null,
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
              source: {
                id: 'source-1',
                slug: 'apt',
                name: 'APT',
                installCmd: 'apt install -y',
                requireSudo: true,
              },
            },
            {
              identifier: 'org.mozilla.firefox',
              sourceId: 'source-2',
              isAvailable: true,
              source: {
                id: 'source-2',
                slug: 'flatpak',
                name: 'Flatpak',
                installCmd: 'flatpak install -y flathub',
                requireSudo: false,
              },
            },
          ],
        },
      ]);

      const result = await generateInstallCommands(request);

      // Should prefer Flatpak despite APT being default
      expect(result.commands).toHaveLength(1);
      expect(result.commands[0]).toBe('flatpak install -y flathub org.mozilla.firefox');
      expect(result.breakdown[0].source).toBe('Flatpak');
    });

    it('should add warning for unavailable packages', async () => {
      const request: GenerateCommandRequest = {
        distroSlug: 'ubuntu',
        appIds: ['app-1', 'app-2'],
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
              installCmd: 'apt install -y',
              requireSudo: true,
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
              source: {
                id: 'source-1',
                slug: 'apt',
                name: 'APT',
                installCmd: 'apt install -y',
                requireSudo: true,
              },
            },
          ],
        },
        {
          id: 'app-2',
          displayName: 'Proprietary App',
          packages: [], // No packages available
        },
      ]);

      const result = await generateInstallCommands(request);

      expect(result.commands).toHaveLength(1);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toBe('Proprietary App: No package available for Ubuntu');
    });

    it('should throw error if distro not found', async () => {
      const request: GenerateCommandRequest = {
        distroSlug: 'non-existent',
        appIds: ['app-1'],
      };

      (db.query.distros.findFirst as Mock).mockResolvedValue(null);

      await expect(generateInstallCommands(request)).rejects.toThrow(
        'Distribution not found. Please select a valid Linux distribution.'
      );
    });

    it('should throw error if distro has no sources configured', async () => {
      const request: GenerateCommandRequest = {
        distroSlug: 'ubuntu',
        appIds: ['app-1'],
      };

      (db.query.distros.findFirst as Mock).mockResolvedValue({
        id: 'distro-1',
        name: 'Ubuntu',
        slug: 'ubuntu',
        distroSources: [],
      });

      await expect(generateInstallCommands(request)).rejects.toThrow(
        'No sources configured for distro "Ubuntu"'
      );
    });

    it('should throw error if no apps found', async () => {
      const request: GenerateCommandRequest = {
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
              installCmd: 'apt install -y',
              requireSudo: true,
            },
          },
        ],
      });

      (db.query.apps.findMany as Mock).mockResolvedValue([]);

      await expect(generateInstallCommands(request)).rejects.toThrow(
        'No apps found for the provided IDs'
      );
    });

    it('should handle apps with only unavailable packages', async () => {
      const request: GenerateCommandRequest = {
        distroSlug: 'ubuntu',
        appIds: ['app-1'],
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
              installCmd: 'apt install -y',
              requireSudo: true,
            },
          },
        ],
      });

      // When packages are unavailable, they're filtered out at query time
      // so the app would have an empty packages array
      (db.query.apps.findMany as Mock).mockResolvedValue([
        {
          id: 'app-1',
          displayName: 'Test App',
          packages: [], // No available packages
        },
      ]);

      const result = await generateInstallCommands(request);

      expect(result.commands).toHaveLength(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toBe('Test App: No package available for Ubuntu');
    });

    it('should group multiple packages by source', async () => {
      const request: GenerateCommandRequest = {
        distroSlug: 'ubuntu',
        appIds: ['app-1', 'app-2', 'app-3'],
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
              installCmd: 'apt install -y',
              requireSudo: true,
              setupCmd: null,
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
              source: {
                id: 'source-1',
                slug: 'apt',
                name: 'APT',
                installCmd: 'apt install -y',
                requireSudo: true,
                setupCmd: null,
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
              source: {
                id: 'source-1',
                slug: 'apt',
                name: 'APT',
                installCmd: 'apt install -y',
                requireSudo: true,
                setupCmd: null,
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
              source: {
                id: 'source-1',
                slug: 'apt',
                name: 'APT',
                installCmd: 'apt install -y',
                requireSudo: true,
                setupCmd: null,
              },
            },
          ],
        },
      ]);

      const result = await generateInstallCommands(request);

      expect(result.commands).toHaveLength(1);
      expect(result.commands[0]).toBe('sudo apt install -y git vim curl');
      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0]).toEqual({
        source: 'APT',
        packages: ['git', 'vim', 'curl'],
      });
    });

    it('should not add duplicate setup commands', async () => {
      const request: GenerateCommandRequest = {
        distroSlug: 'ubuntu',
        appIds: ['app-1', 'app-2'],
      };

      const flatpakSetupCmd = 'flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo';

      (db.query.distros.findFirst as Mock).mockResolvedValue({
        id: 'distro-1',
        name: 'Ubuntu',
        slug: 'ubuntu',
        distroSources: [
          {
            priority: 5,
            isDefault: false,
            source: {
              id: 'source-1',
              name: 'Flatpak',
              slug: 'flatpak',
              installCmd: 'flatpak install -y flathub',
              requireSudo: false,
              setupCmd: flatpakSetupCmd,
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
              source: {
                id: 'source-1',
                slug: 'flatpak',
                name: 'Flatpak',
                installCmd: 'flatpak install -y flathub',
                requireSudo: false,
                setupCmd: flatpakSetupCmd,
              },
            },
          ],
        },
        {
          id: 'app-2',
          displayName: 'VLC',
          packages: [
            {
              identifier: 'org.videolan.VLC',
              sourceId: 'source-1',
              isAvailable: true,
              source: {
                id: 'source-1',
                slug: 'flatpak',
                name: 'Flatpak',
                installCmd: 'flatpak install -y flathub',
                requireSudo: false,
                setupCmd: flatpakSetupCmd,
              },
            },
          ],
        },
      ]);

      const result = await generateInstallCommands(request);

      // Setup command should only appear once
      expect(result.setupCommands).toHaveLength(1);
      expect(result.setupCommands[0]).toBe(flatpakSetupCmd);
    });

    it('should not require sudo for sources that don\'t need it', async () => {
      const request: GenerateCommandRequest = {
        distroSlug: 'ubuntu',
        appIds: ['app-1'],
      };

      (db.query.distros.findFirst as Mock).mockResolvedValue({
        id: 'distro-1',
        name: 'Ubuntu',
        slug: 'ubuntu',
        distroSources: [
          {
            priority: 5,
            isDefault: true,
            source: {
              id: 'source-1',
              name: 'Flatpak',
              slug: 'flatpak',
              installCmd: 'flatpak install -y flathub',
              requireSudo: false,
              setupCmd: null,
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
              source: {
                id: 'source-1',
                slug: 'flatpak',
                name: 'Flatpak',
                installCmd: 'flatpak install -y flathub',
                requireSudo: false,
              },
            },
          ],
        },
      ]);

      const result = await generateInstallCommands(request);

      expect(result.commands).toHaveLength(1);
      expect(result.commands[0]).toBe('flatpak install -y flathub org.mozilla.firefox');
      expect(result.commands[0]).not.toContain('sudo');
    });
  });
});
