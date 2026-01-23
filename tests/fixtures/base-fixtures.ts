/**
 * Base Fixtures - Shared test data for E2E tests
 *
 * This file contains fixture data that can be reused across all E2E tests.
 * Fixtures provide consistent, known data for testing different scenarios.
 */

export const baseFixtures = {
  // Categories
  categories: {
    browsers: {
      id: 'browsers',
      name: 'Browsers',
      slug: 'browsers',
      description: 'Web browsers',
      icon: '🌐',
    },
    development: {
      id: 'development',
      name: 'Development',
      slug: 'development',
      description: 'Development tools',
      icon: '💻',
    },
    media: {
      id: 'media',
      name: 'Media',
      slug: 'media',
      description: 'Media players and editors',
      icon: '🎵',
    },
    utilities: {
      id: 'utilities',
      name: 'Utilities',
      slug: 'utilities',
      description: 'System utilities',
      icon: '🔧',
    },
  },

  // Distros
  distros: {
    ubuntu: {
      id: 'ubuntu-22-04',
      name: 'Ubuntu 22.04',
      slug: 'ubuntu-22-04',
      codename: 'jammy',
      logo: 'ubuntu.svg',
    },
    fedora: {
      id: 'fedora-39',
      name: 'Fedora 39',
      slug: 'fedora-39',
      codename: null,
      logo: 'fedora.svg',
    },
    arch: {
      id: 'arch-linux',
      name: 'Arch Linux',
      slug: 'arch-linux',
      codename: null,
      logo: 'arch.svg',
    },
    debian: {
      id: 'debian-12',
      name: 'Debian 12',
      slug: 'debian-12',
      codename: 'bookworm',
      logo: 'debian.svg',
    },
  },

  // Sources
  sources: {
    apt: {
      id: 'apt',
      name: 'APT',
      slug: 'apt',
      type: 'package_manager' as const,
      installMethod: 'sudo apt install -y {packages}',
      uninstallMethod: 'sudo apt remove -y {packages}',
      setupCommand: null,
      perPackageSetup: false,
    },
    dnf: {
      id: 'dnf',
      name: 'DNF',
      slug: 'dnf',
      type: 'package_manager' as const,
      installMethod: 'sudo dnf install -y {packages}',
      uninstallMethod: 'sudo dnf remove -y {packages}',
      setupCommand: null,
      perPackageSetup: false,
    },
    pacman: {
      id: 'pacman',
      name: 'Pacman',
      slug: 'pacman',
      type: 'package_manager' as const,
      installMethod: 'sudo pacman -S --noconfirm {packages}',
      uninstallMethod: 'sudo pacman -R --noconfirm {packages}',
      setupCommand: null,
      perPackageSetup: false,
    },
    flatpak: {
      id: 'flatpak',
      name: 'Flatpak',
      slug: 'flatpak',
      type: 'store' as const,
      installMethod: 'flatpak install -y flathub {packages}',
      uninstallMethod: 'flatpak uninstall -y {packages}',
      setupCommand: 'flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo',
      perPackageSetup: false,
    },
    snap: {
      id: 'snap',
      name: 'Snap',
      slug: 'snap',
      type: 'store' as const,
      installMethod: 'sudo snap install {packages}',
      uninstallMethod: 'sudo snap remove {packages}',
      setupCommand: null,
      perPackageSetup: false,
    },
  },

  // Apps
  apps: {
    firefox: {
      id: 'firefox',
      name: 'Firefox',
      slug: 'firefox',
      description: 'Fast, private and safe web browser',
      categoryId: 'browsers',
      homepageUrl: 'https://www.mozilla.org/firefox/',
      iconUrl: 'https://example.com/icons/firefox.png',
    },
    chrome: {
      id: 'chrome',
      name: 'Google Chrome',
      slug: 'chrome',
      description: 'Fast, secure web browser',
      categoryId: 'browsers',
      homepageUrl: 'https://www.google.com/chrome/',
      iconUrl: 'https://example.com/icons/chrome.png',
    },
    vscode: {
      id: 'vscode',
      name: 'Visual Studio Code',
      slug: 'vscode',
      description: 'Code editor',
      categoryId: 'development',
      homepageUrl: 'https://code.visualstudio.com/',
      iconUrl: 'https://example.com/icons/vscode.png',
    },
    vlc: {
      id: 'vlc',
      name: 'VLC Media Player',
      slug: 'vlc',
      description: 'Multimedia player',
      categoryId: 'media',
      homepageUrl: 'https://www.videolan.org/vlc/',
      iconUrl: 'https://example.com/icons/vlc.png',
    },
    gimp: {
      id: 'gimp',
      name: 'GIMP',
      slug: 'gimp',
      description: 'Image editor',
      categoryId: 'media',
      homepageUrl: 'https://www.gimp.org/',
      iconUrl: 'https://example.com/icons/gimp.png',
    },
  },

  // Packages (linking apps to sources)
  packages: {
    firefoxApt: {
      appId: 'firefox',
      sourceId: 'apt',
      packageId: 'firefox',
      packageName: 'Firefox',
      packageUrl: 'https://packages.ubuntu.com/firefox',
    },
    firefoxFlatpak: {
      appId: 'firefox',
      sourceId: 'flatpak',
      packageId: 'org.mozilla.firefox',
      packageName: 'Firefox',
      packageUrl: 'https://flathub.org/apps/org.mozilla.firefox',
    },
    firefoxSnap: {
      appId: 'firefox',
      sourceId: 'snap',
      packageId: 'firefox',
      packageName: 'Firefox',
      packageUrl: 'https://snapcraft.io/firefox',
    },
    chromeFlatpak: {
      appId: 'chrome',
      sourceId: 'flatpak',
      packageId: 'com.google.Chrome',
      packageName: 'Google Chrome',
      packageUrl: 'https://flathub.org/apps/com.google.Chrome',
    },
    vscodeDeb: {
      appId: 'vscode',
      sourceId: 'apt',
      packageId: 'code',
      packageName: 'Visual Studio Code',
      packageUrl: 'https://code.visualstudio.com/docs/setup/linux',
    },
    vscodeFlatpak: {
      appId: 'vscode',
      sourceId: 'flatpak',
      packageId: 'com.visualstudio.code',
      packageName: 'Visual Studio Code',
      packageUrl: 'https://flathub.org/apps/com.visualstudio.code',
    },
    vlcApt: {
      appId: 'vlc',
      sourceId: 'apt',
      packageId: 'vlc',
      packageName: 'VLC',
      packageUrl: 'https://packages.ubuntu.com/vlc',
    },
    vlcFlatpak: {
      appId: 'vlc',
      sourceId: 'flatpak',
      packageId: 'org.videolan.VLC',
      packageName: 'VLC',
      packageUrl: 'https://flathub.org/apps/org.videolan.VLC',
    },
    gimpApt: {
      appId: 'gimp',
      sourceId: 'apt',
      packageId: 'gimp',
      packageName: 'GIMP',
      packageUrl: 'https://packages.ubuntu.com/gimp',
    },
  },

  // Distro-Source mappings
  distroSources: {
    ubuntuApt: {
      distroId: 'ubuntu-22-04',
      sourceId: 'apt',
      priority: 1,
    },
    ubuntuFlatpak: {
      distroId: 'ubuntu-22-04',
      sourceId: 'flatpak',
      priority: 2,
    },
    ubuntuSnap: {
      distroId: 'ubuntu-22-04',
      sourceId: 'snap',
      priority: 3,
    },
    fedoraDnf: {
      distroId: 'fedora-39',
      sourceId: 'dnf',
      priority: 1,
    },
    fedoraFlatpak: {
      distroId: 'fedora-39',
      sourceId: 'flatpak',
      priority: 2,
    },
    archPacman: {
      distroId: 'arch-linux',
      sourceId: 'pacman',
      priority: 1,
    },
    archFlatpak: {
      distroId: 'arch-linux',
      sourceId: 'flatpak',
      priority: 2,
    },
  },

  // Test admin user
  testAdmin: {
    id: 'test-admin-id',
    email: 'admin@test.linite.com',
    name: 'Test Admin',
    emailVerified: true,
    image: null,
  },
};

/**
 * Helper to generate unique IDs for test data
 */
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Helper to create a test app with random data
 */
export function createTestApp(overrides: Partial<typeof baseFixtures.apps.firefox> = {}) {
  const id = generateTestId('app');
  return {
    id,
    name: `Test App ${id}`,
    slug: `test-app-${id}`,
    description: 'Test app description',
    categoryId: 'browsers',
    homepageUrl: 'https://example.com',
    iconUrl: 'https://example.com/icon.png',
    ...overrides,
  };
}

/**
 * Helper to create a test package
 */
export function createTestPackage(
  appId: string,
  sourceId: string,
  overrides: Partial<typeof baseFixtures.packages.firefoxApt> = {}
) {
  return {
    appId,
    sourceId,
    packageId: `test-pkg-${generateTestId()}`,
    packageName: 'Test Package',
    packageUrl: 'https://example.com/package',
    ...overrides,
  };
}
