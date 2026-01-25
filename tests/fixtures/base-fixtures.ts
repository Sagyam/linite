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
      family: 'debian',
      basedOn: 'debian',
      iconUrl: 'https://example.com/ubuntu.svg',
      isPopular: true,
    },
    fedora: {
      id: 'fedora-39',
      name: 'Fedora 39',
      slug: 'fedora-39',
      family: 'rhel',
      basedOn: null,
      iconUrl: 'https://example.com/fedora.svg',
      isPopular: true,
    },
    arch: {
      id: 'arch-linux',
      name: 'Arch Linux',
      slug: 'arch-linux',
      family: 'arch',
      basedOn: null,
      iconUrl: 'https://example.com/arch.svg',
      isPopular: true,
    },
    debian: {
      id: 'debian-12',
      name: 'Debian 12',
      slug: 'debian-12',
      family: 'debian',
      basedOn: null,
      iconUrl: 'https://example.com/debian.svg',
      isPopular: true,
    },
  },

  // Sources
  sources: {
    apt: {
      id: 'apt',
      name: 'APT',
      slug: 'apt',
      installCmd: 'apt install -y',
      removeCmd: 'apt remove -y',
      requireSudo: true,
      setupCmd: null,
      cleanupCmd: null,
      supportsDependencyCleanup: true,
      dependencyCleanupCmd: 'apt autoremove -y',
      priority: 10,
      apiEndpoint: null,
    },
    dnf: {
      id: 'dnf',
      name: 'DNF',
      slug: 'dnf',
      installCmd: 'dnf install -y',
      removeCmd: 'dnf remove -y',
      requireSudo: true,
      setupCmd: null,
      cleanupCmd: null,
      supportsDependencyCleanup: true,
      dependencyCleanupCmd: 'dnf autoremove -y',
      priority: 10,
      apiEndpoint: null,
    },
    pacman: {
      id: 'pacman',
      name: 'Pacman',
      slug: 'pacman',
      installCmd: 'pacman -S --noconfirm',
      removeCmd: 'pacman -R --noconfirm',
      requireSudo: true,
      setupCmd: null,
      cleanupCmd: null,
      supportsDependencyCleanup: false,
      dependencyCleanupCmd: null,
      priority: 10,
      apiEndpoint: null,
    },
    flatpak: {
      id: 'flatpak',
      name: 'Flatpak',
      slug: 'flatpak',
      installCmd: 'flatpak install -y flathub',
      removeCmd: 'flatpak uninstall -y',
      requireSudo: false,
      setupCmd: 'flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo',
      cleanupCmd: 'flatpak remote-delete flathub',
      supportsDependencyCleanup: true,
      dependencyCleanupCmd: 'flatpak uninstall --unused -y',
      priority: 5,
      apiEndpoint: 'https://flathub.org/api/v2/',
    },
    snap: {
      id: 'snap',
      name: 'Snap',
      slug: 'snap',
      installCmd: 'snap install',
      removeCmd: 'snap remove',
      requireSudo: true,
      setupCmd: null,
      cleanupCmd: null,
      supportsDependencyCleanup: false,
      dependencyCleanupCmd: null,
      priority: 3,
      apiEndpoint: 'https://api.snapcraft.io/v2/',
    },
  },

  // Apps
  apps: {
    firefox: {
      id: 'firefox',
      slug: 'firefox',
      displayName: 'Firefox',
      description: 'Fast, private and safe web browser',
      categoryId: 'browsers',
      homepage: 'https://www.mozilla.org/firefox/',
      iconUrl: 'https://example.com/icons/firefox.png',
      isPopular: true,
      isFoss: true,
    },
    chrome: {
      id: 'chrome',
      slug: 'chrome',
      displayName: 'Google Chrome',
      description: 'Fast, secure web browser',
      categoryId: 'browsers',
      homepage: 'https://www.google.com/chrome/',
      iconUrl: 'https://example.com/icons/chrome.png',
      isPopular: true,
      isFoss: false,
    },
    vscode: {
      id: 'vscode',
      slug: 'vscode',
      displayName: 'Visual Studio Code',
      description: 'Code editor',
      categoryId: 'development',
      homepage: 'https://code.visualstudio.com/',
      iconUrl: 'https://example.com/icons/vscode.png',
      isPopular: true,
      isFoss: false,
    },
    vlc: {
      id: 'vlc',
      slug: 'vlc',
      displayName: 'VLC Media Player',
      description: 'Multimedia player',
      categoryId: 'media',
      homepage: 'https://www.videolan.org/vlc/',
      iconUrl: 'https://example.com/icons/vlc.png',
      isPopular: true,
      isFoss: true,
    },
    gimp: {
      id: 'gimp',
      slug: 'gimp',
      displayName: 'GIMP',
      description: 'Image editor',
      categoryId: 'media',
      homepage: 'https://www.gimp.org/',
      iconUrl: 'https://example.com/icons/gimp.png',
      isPopular: false,
      isFoss: true,
    },
  },

  // Packages (linking apps to sources)
  packages: {
    firefoxApt: {
      appId: 'firefox',
      sourceId: 'apt',
      identifier: 'firefox',
      version: null,
      size: null,
      maintainer: null,
      isAvailable: true,
      metadata: { url: 'https://packages.ubuntu.com/firefox' },
    },
    firefoxFlatpak: {
      appId: 'firefox',
      sourceId: 'flatpak',
      identifier: 'org.mozilla.firefox',
      version: null,
      size: null,
      maintainer: null,
      isAvailable: true,
      metadata: { url: 'https://flathub.org/apps/org.mozilla.firefox' },
    },
    firefoxSnap: {
      appId: 'firefox',
      sourceId: 'snap',
      identifier: 'firefox',
      version: null,
      size: null,
      maintainer: null,
      isAvailable: true,
      metadata: { url: 'https://snapcraft.io/firefox' },
    },
    chromeFlatpak: {
      appId: 'chrome',
      sourceId: 'flatpak',
      identifier: 'com.google.Chrome',
      version: null,
      size: null,
      maintainer: null,
      isAvailable: true,
      metadata: { url: 'https://flathub.org/apps/com.google.Chrome' },
    },
    vscodeDeb: {
      appId: 'vscode',
      sourceId: 'apt',
      identifier: 'code',
      version: null,
      size: null,
      maintainer: null,
      isAvailable: true,
      metadata: { url: 'https://code.visualstudio.com/docs/setup/linux' },
    },
    vscodeFlatpak: {
      appId: 'vscode',
      sourceId: 'flatpak',
      identifier: 'com.visualstudio.code',
      version: null,
      size: null,
      maintainer: null,
      isAvailable: true,
      metadata: { url: 'https://flathub.org/apps/com.visualstudio.code' },
    },
    vlcApt: {
      appId: 'vlc',
      sourceId: 'apt',
      identifier: 'vlc',
      version: null,
      size: null,
      maintainer: null,
      isAvailable: true,
      metadata: { url: 'https://packages.ubuntu.com/vlc' },
    },
    vlcFlatpak: {
      appId: 'vlc',
      sourceId: 'flatpak',
      identifier: 'org.videolan.VLC',
      version: null,
      size: null,
      maintainer: null,
      isAvailable: true,
      metadata: { url: 'https://flathub.org/apps/org.videolan.VLC' },
    },
    gimpApt: {
      appId: 'gimp',
      sourceId: 'apt',
      identifier: 'gimp',
      version: null,
      size: null,
      maintainer: null,
      isAvailable: true,
      metadata: { url: 'https://packages.ubuntu.com/gimp' },
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
    slug: `test-app-${id}`,
    displayName: `Test App ${id}`,
    description: 'Test app description',
    categoryId: 'browsers',
    homepage: 'https://example.com',
    iconUrl: 'https://example.com/icon.png',
    isPopular: false,
    isFoss: true,
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
    identifier: `test-pkg-${generateTestId()}`,
    version: null,
    size: null,
    maintainer: null,
    isAvailable: true,
    metadata: { url: 'https://example.com/package' },
    ...overrides,
  };
}
