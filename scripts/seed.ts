import { db, categories, sources, distros, distroSources, apps, packages } from '../src/db';

async function seed() {
  console.log('🌱 Seeding database...');

  // 1. Create categories
  console.log('Creating categories...');
  const categoriesData = [
    { name: 'Browsers', slug: 'browsers', icon: 'Globe', displayOrder: 1 },
    { name: 'Development', slug: 'development', icon: 'Code', displayOrder: 2 },
    { name: 'Media', slug: 'media', icon: 'Play', displayOrder: 3 },
    { name: 'Graphics', slug: 'graphics', icon: 'Image', displayOrder: 4 },
    { name: 'Office', slug: 'office', icon: 'FileText', displayOrder: 5 },
    { name: 'Utilities', slug: 'utilities', icon: 'Wrench', displayOrder: 6 },
    { name: 'Communication', slug: 'communication', icon: 'MessageCircle', displayOrder: 7 },
    { name: 'Games', slug: 'games', icon: 'Gamepad2', displayOrder: 8 },
    { name: 'Security', slug: 'security', icon: 'Shield', displayOrder: 9 },
    { name: 'System', slug: 'system', icon: 'Settings', displayOrder: 10 },
  ];

  const createdCategories = await db.insert(categories).values(categoriesData).returning();
  console.log(`✅ Created ${createdCategories.length} categories`);

  // 2. Create sources
  console.log('Creating sources...');
  const sourcesData = [
    // Linux package managers
    {
      name: 'Flatpak',
      slug: 'flatpak',
      installCmd: 'flatpak install -y flathub',
      requireSudo: false,
      setupCmd: 'flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo',
      priority: 5,
      apiEndpoint: 'https://flathub.org/api/v2/',
    },
    {
      name: 'Snap',
      slug: 'snap',
      installCmd: 'snap install',
      requireSudo: true,
      setupCmd: null,
      priority: 3,
      apiEndpoint: 'https://api.snapcraft.io/v2/',
    },
    {
      name: 'APT',
      slug: 'apt',
      installCmd: 'apt install -y',
      requireSudo: true,
      setupCmd: null,
      priority: 10,
      apiEndpoint: null,
    },
    {
      name: 'DNF',
      slug: 'dnf',
      installCmd: 'dnf install -y',
      requireSudo: true,
      setupCmd: null,
      priority: 10,
      apiEndpoint: null,
    },
    {
      name: 'Pacman',
      slug: 'pacman',
      installCmd: 'pacman -S --noconfirm',
      requireSudo: true,
      setupCmd: null,
      priority: 10,
      apiEndpoint: null,
    },
    {
      name: 'Zypper',
      slug: 'zypper',
      installCmd: 'zypper install -y',
      requireSudo: true,
      setupCmd: null,
      priority: 10,
      apiEndpoint: null,
    },
    // Windows package managers
    {
      name: 'Winget',
      slug: 'winget',
      installCmd: 'winget install --silent --accept-package-agreements --accept-source-agreements',
      requireSudo: false,
      setupCmd: null,
      priority: 10,
      apiEndpoint: 'https://api.winget.run/',
    },
    {
      name: 'Chocolatey',
      slug: 'choco',
      installCmd: 'choco install -y',
      requireSudo: true,
      setupCmd: 'Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString(\'https://community.chocolatey.org/install.ps1\'))',
      priority: 8,
      apiEndpoint: 'https://community.chocolatey.org/api/v2/',
    },
    {
      name: 'Scoop',
      slug: 'scoop',
      installCmd: 'scoop install',
      requireSudo: false,
      setupCmd: 'Set-ExecutionPolicy RemoteSigned -Scope CurrentUser; irm get.scoop.sh | iex',
      priority: 6,
      apiEndpoint: null,
    },
  ];

  const createdSources = await db.insert(sources).values(sourcesData).returning();
  console.log(`✅ Created ${createdSources.length} sources`);

  // 3. Create distros
  console.log('Creating distros...');
  const distrosData = [
    // Linux distributions
    { name: 'Ubuntu', slug: 'ubuntu', family: 'debian', basedOn: 'debian', isPopular: true },
    { name: 'Debian', slug: 'debian', family: 'debian', basedOn: null, isPopular: true },
    { name: 'Linux Mint', slug: 'linuxmint', family: 'debian', basedOn: 'ubuntu', isPopular: true },
    { name: 'Pop!_OS', slug: 'pop', family: 'debian', basedOn: 'ubuntu', isPopular: true },
    { name: 'Fedora', slug: 'fedora', family: 'rhel', basedOn: null, isPopular: true },
    { name: 'Arch Linux', slug: 'arch', family: 'arch', basedOn: null, isPopular: true },
    { name: 'Manjaro', slug: 'manjaro', family: 'arch', basedOn: 'arch', isPopular: true },
    { name: 'openSUSE', slug: 'opensuse', family: 'suse', basedOn: null, isPopular: false },
    // Windows
    { name: 'Windows', slug: 'windows', family: 'windows', basedOn: null, isPopular: true },
  ];

  const createdDistros = await db.insert(distros).values(distrosData).returning();
  console.log(`✅ Created ${createdDistros.length} distros`);

  // 4. Map distros to sources
  console.log('Mapping distros to sources...');
  const sourceMap = Object.fromEntries(createdSources.map(s => [s.slug, s.id]));
  const distroMap = Object.fromEntries(createdDistros.map(d => [d.slug, d.id]));

  const distroSourceMappings = [
    // Ubuntu
    { distroId: distroMap.ubuntu, sourceId: sourceMap.apt, priority: 10, isDefault: true },
    { distroId: distroMap.ubuntu, sourceId: sourceMap.flatpak, priority: 5, isDefault: false },
    { distroId: distroMap.ubuntu, sourceId: sourceMap.snap, priority: 3, isDefault: false },

    // Debian
    { distroId: distroMap.debian, sourceId: sourceMap.apt, priority: 10, isDefault: true },
    { distroId: distroMap.debian, sourceId: sourceMap.flatpak, priority: 5, isDefault: false },

    // Linux Mint
    { distroId: distroMap.linuxmint, sourceId: sourceMap.apt, priority: 10, isDefault: true },
    { distroId: distroMap.linuxmint, sourceId: sourceMap.flatpak, priority: 5, isDefault: false },

    // Pop!_OS
    { distroId: distroMap.pop, sourceId: sourceMap.apt, priority: 10, isDefault: true },
    { distroId: distroMap.pop, sourceId: sourceMap.flatpak, priority: 5, isDefault: false },

    // Fedora
    { distroId: distroMap.fedora, sourceId: sourceMap.dnf, priority: 10, isDefault: true },
    { distroId: distroMap.fedora, sourceId: sourceMap.flatpak, priority: 5, isDefault: false },

    // Arch Linux
    { distroId: distroMap.arch, sourceId: sourceMap.pacman, priority: 10, isDefault: true },
    { distroId: distroMap.arch, sourceId: sourceMap.flatpak, priority: 3, isDefault: false },

    // Manjaro
    { distroId: distroMap.manjaro, sourceId: sourceMap.pacman, priority: 10, isDefault: true },
    { distroId: distroMap.manjaro, sourceId: sourceMap.flatpak, priority: 5, isDefault: false },
    { distroId: distroMap.manjaro, sourceId: sourceMap.snap, priority: 3, isDefault: false },

    // openSUSE
    { distroId: distroMap.opensuse, sourceId: sourceMap.zypper, priority: 10, isDefault: true },
    { distroId: distroMap.opensuse, sourceId: sourceMap.flatpak, priority: 5, isDefault: false },

    // Windows
    { distroId: distroMap.windows, sourceId: sourceMap.winget, priority: 10, isDefault: true },
    { distroId: distroMap.windows, sourceId: sourceMap.choco, priority: 8, isDefault: false },
    { distroId: distroMap.windows, sourceId: sourceMap.scoop, priority: 6, isDefault: false },
  ];

  await db.insert(distroSources).values(distroSourceMappings);
  console.log(`✅ Created ${distroSourceMappings.length} distro-source mappings`);

  // 5. Create sample apps
  console.log('Creating sample apps...');
  const categoryMap = Object.fromEntries(createdCategories.map(c => [c.slug, c.id]));

  const appsData = [
    // === BROWSERS ===
    {
      slug: 'firefox',
      displayName: 'Firefox',
      description: 'Fast, private and safe web browser',
      homepage: 'https://firefox.com',
      isPopular: true,
      isFoss: true,
      categoryId: categoryMap.browsers,
    },
    {
      slug: 'chrome',
      displayName: 'Google Chrome',
      description: 'Fast, secure web browser by Google',
      homepage: 'https://google.com/chrome',
      isPopular: true,
      isFoss: false,
      categoryId: categoryMap.browsers,
    },
    {
      slug: 'brave',
      displayName: 'Brave Browser',
      description: 'Secure, fast and private web browser with ad blocking',
      homepage: 'https://brave.com',
      isPopular: true,
      isFoss: true,
      categoryId: categoryMap.browsers,
    },
    {
      slug: 'chromium',
      displayName: 'Chromium',
      description: 'Open-source web browser project',
      homepage: 'https://chromium.org',
      isPopular: false,
      isFoss: true,
      categoryId: categoryMap.browsers,
    },
    {
      slug: 'vivaldi',
      displayName: 'Vivaldi',
      description: 'Feature-rich and highly customizable browser',
      homepage: 'https://vivaldi.com',
      isPopular: false,
      isFoss: false,
      categoryId: categoryMap.browsers,
    },

    // === DEVELOPMENT ===
    {
      slug: 'vscode',
      displayName: 'Visual Studio Code',
      description: 'Code editor redefined and optimized for building and debugging',
      homepage: 'https://code.visualstudio.com',
      isPopular: true,
      isFoss: false,
      categoryId: categoryMap.development,
    },
    {
      slug: 'git',
      displayName: 'Git',
      description: 'Distributed version control system',
      homepage: 'https://git-scm.com',
      isPopular: true,
      isFoss: true,
      categoryId: categoryMap.development,
    },
    {
      slug: 'docker',
      displayName: 'Docker',
      description: 'Platform for developing, shipping, and running applications in containers',
      homepage: 'https://docker.com',
      isPopular: true,
      isFoss: true,
      categoryId: categoryMap.development,
    },
    {
      slug: 'nodejs',
      displayName: 'Node.js',
      description: 'JavaScript runtime built on Chrome\'s V8 engine',
      homepage: 'https://nodejs.org',
      isPopular: true,
      isFoss: true,
      categoryId: categoryMap.development,
    },
    {
      slug: 'intellij',
      displayName: 'IntelliJ IDEA Community',
      description: 'Java IDE by JetBrains',
      homepage: 'https://jetbrains.com/idea',
      isPopular: true,
      isFoss: true,
      categoryId: categoryMap.development,
    },
    {
      slug: 'postman',
      displayName: 'Postman',
      description: 'API development and testing platform',
      homepage: 'https://postman.com',
      isPopular: true,
      isFoss: false,
      categoryId: categoryMap.development,
    },
    {
      slug: 'dbeaver',
      displayName: 'DBeaver',
      description: 'Universal database management tool',
      homepage: 'https://dbeaver.io',
      isPopular: false,
      isFoss: true,
      categoryId: categoryMap.development,
    },

    // === MEDIA ===
    {
      slug: 'vlc',
      displayName: 'VLC Media Player',
      description: 'Free and open source cross-platform multimedia player',
      homepage: 'https://videolan.org/vlc',
      isPopular: true,
      isFoss: true,
      categoryId: categoryMap.media,
    },
    {
      slug: 'spotify',
      displayName: 'Spotify',
      description: 'Digital music streaming service',
      homepage: 'https://spotify.com',
      isPopular: true,
      isFoss: false,
      categoryId: categoryMap.media,
    },
    {
      slug: 'obs',
      displayName: 'OBS Studio',
      description: 'Free and open source software for video recording and live streaming',
      homepage: 'https://obsproject.com',
      isPopular: true,
      isFoss: true,
      categoryId: categoryMap.media,
    },
    {
      slug: 'kdenlive',
      displayName: 'Kdenlive',
      description: 'Free and open source video editor',
      homepage: 'https://kdenlive.org',
      isPopular: false,
      isFoss: true,
      categoryId: categoryMap.media,
    },
    {
      slug: 'audacity',
      displayName: 'Audacity',
      description: 'Free, open source, cross-platform audio software',
      homepage: 'https://audacityteam.org',
      isPopular: true,
      isFoss: true,
      categoryId: categoryMap.media,
    },
    {
      slug: 'mpv',
      displayName: 'mpv',
      description: 'Free, open source, and cross-platform media player',
      homepage: 'https://mpv.io',
      isPopular: false,
      isFoss: true,
      categoryId: categoryMap.media,
    },
    {
      slug: 'handbrake',
      displayName: 'HandBrake',
      description: 'Open source video transcoder',
      homepage: 'https://handbrake.fr',
      isPopular: false,
      isFoss: true,
      categoryId: categoryMap.media,
    },

    // === GRAPHICS ===
    {
      slug: 'gimp',
      displayName: 'GIMP',
      description: 'GNU Image Manipulation Program',
      homepage: 'https://gimp.org',
      isPopular: true,
      isFoss: true,
      categoryId: categoryMap.graphics,
    },
    {
      slug: 'inkscape',
      displayName: 'Inkscape',
      description: 'Professional vector graphics editor',
      homepage: 'https://inkscape.org',
      isPopular: true,
      isFoss: true,
      categoryId: categoryMap.graphics,
    },
    {
      slug: 'blender',
      displayName: 'Blender',
      description: 'Free and open source 3D creation suite',
      homepage: 'https://blender.org',
      isPopular: true,
      isFoss: true,
      categoryId: categoryMap.graphics,
    },
    {
      slug: 'krita',
      displayName: 'Krita',
      description: 'Professional free and open source painting program',
      homepage: 'https://krita.org',
      isPopular: true,
      isFoss: true,
      categoryId: categoryMap.graphics,
    },
    {
      slug: 'darktable',
      displayName: 'darktable',
      description: 'Photography workflow application and raw developer',
      homepage: 'https://darktable.org',
      isPopular: false,
      isFoss: true,
      categoryId: categoryMap.graphics,
    },

    // === OFFICE ===
    {
      slug: 'libreoffice',
      displayName: 'LibreOffice',
      description: 'Free and powerful office suite',
      homepage: 'https://libreoffice.org',
      isPopular: true,
      isFoss: true,
      categoryId: categoryMap.office,
    },
    {
      slug: 'onlyoffice',
      displayName: 'ONLYOFFICE',
      description: 'Free office suite with online collaboration',
      homepage: 'https://onlyoffice.com',
      isPopular: false,
      isFoss: true,
      categoryId: categoryMap.office,
    },
    {
      slug: 'obsidian',
      displayName: 'Obsidian',
      description: 'Powerful knowledge base on top of local markdown files',
      homepage: 'https://obsidian.md',
      isPopular: true,
      isFoss: false,
      categoryId: categoryMap.office,
    },
    {
      slug: 'notion',
      displayName: 'Notion',
      description: 'All-in-one workspace for notes, tasks, and collaboration',
      homepage: 'https://notion.so',
      isPopular: true,
      isFoss: false,
      categoryId: categoryMap.office,
    },

    // === UTILITIES ===
    {
      slug: 'flameshot',
      displayName: 'Flameshot',
      description: 'Powerful yet simple to use screenshot software',
      homepage: 'https://flameshot.org',
      isPopular: true,
      isFoss: true,
      categoryId: categoryMap.utilities,
    },
    {
      slug: 'syncthing',
      displayName: 'Syncthing',
      description: 'Continuous file synchronization program',
      homepage: 'https://syncthing.net',
      isPopular: false,
      isFoss: true,
      categoryId: categoryMap.utilities,
    },
    {
      slug: 'balena-etcher',
      displayName: 'balenaEtcher',
      description: 'Flash OS images to SD cards and USB drives',
      homepage: 'https://balena.io/etcher',
      isPopular: true,
      isFoss: true,
      categoryId: categoryMap.utilities,
    },

    // === COMMUNICATION ===
    {
      slug: 'discord',
      displayName: 'Discord',
      description: 'Voice, video and text chat app',
      homepage: 'https://discord.com',
      isPopular: true,
      isFoss: false,
      categoryId: categoryMap.communication,
    },
    {
      slug: 'slack',
      displayName: 'Slack',
      description: 'Team communication and collaboration platform',
      homepage: 'https://slack.com',
      isPopular: true,
      isFoss: false,
      categoryId: categoryMap.communication,
    },
    {
      slug: 'thunderbird',
      displayName: 'Thunderbird',
      description: 'Free email application that\'s easy to set up and customize',
      homepage: 'https://thunderbird.net',
      isPopular: true,
      isFoss: true,
      categoryId: categoryMap.communication,
    },
    {
      slug: 'telegram',
      displayName: 'Telegram Desktop',
      description: 'Fast and secure messaging app',
      homepage: 'https://telegram.org',
      isPopular: true,
      isFoss: true,
      categoryId: categoryMap.communication,
    },
    {
      slug: 'zoom',
      displayName: 'Zoom',
      description: 'Video conferencing and web conferencing service',
      homepage: 'https://zoom.us',
      isPopular: true,
      isFoss: false,
      categoryId: categoryMap.communication,
    },

    // === GAMES ===
    {
      slug: 'steam',
      displayName: 'Steam',
      description: 'Digital distribution platform for video games',
      homepage: 'https://steampowered.com',
      isPopular: true,
      isFoss: false,
      categoryId: categoryMap.games,
    },
    {
      slug: 'lutris',
      displayName: 'Lutris',
      description: 'Open source gaming platform for Linux',
      homepage: 'https://lutris.net',
      isPopular: true,
      isFoss: true,
      categoryId: categoryMap.games,
    },
    {
      slug: 'minecraft',
      displayName: 'Minecraft',
      description: 'Sandbox video game',
      homepage: 'https://minecraft.net',
      isPopular: true,
      isFoss: false,
      categoryId: categoryMap.games,
    },
    {
      slug: 'heroic',
      displayName: 'Heroic Games Launcher',
      description: 'Epic Games Launcher alternative for Linux',
      homepage: 'https://heroicgameslauncher.com',
      isPopular: false,
      isFoss: true,
      categoryId: categoryMap.games,
    },

    // === SECURITY ===
    {
      slug: 'keepassxc',
      displayName: 'KeePassXC',
      description: 'Cross-platform password manager',
      homepage: 'https://keepassxc.org',
      isPopular: true,
      isFoss: true,
      categoryId: categoryMap.security,
    },
    {
      slug: 'bitwarden',
      displayName: 'Bitwarden',
      description: 'Open source password manager',
      homepage: 'https://bitwarden.com',
      isPopular: true,
      isFoss: true,
      categoryId: categoryMap.security,
    },
    {
      slug: 'veracrypt',
      displayName: 'VeraCrypt',
      description: 'Free open source disk encryption software',
      homepage: 'https://veracrypt.fr',
      isPopular: false,
      isFoss: true,
      categoryId: categoryMap.security,
    },
    {
      slug: 'clamav',
      displayName: 'ClamAV',
      description: 'Open source antivirus engine',
      homepage: 'https://clamav.net',
      isPopular: false,
      isFoss: true,
      categoryId: categoryMap.security,
    },

    // === SYSTEM ===
    {
      slug: 'btop',
      displayName: 'btop',
      description: 'Resource monitor that shows usage and stats',
      homepage: 'https://github.com/aristocratos/btop',
      isPopular: false,
      isFoss: true,
      categoryId: categoryMap.system,
    },
  ];

  const createdApps = await db.insert(apps).values(appsData).returning();
  console.log(`✅ Created ${createdApps.length} apps`);

  // 6. Create sample packages
  console.log('Creating sample packages...');
  const appMap = Object.fromEntries(createdApps.map(a => [a.slug, a.id]));

  const packagesData = [
    // === BROWSERS ===
    // Firefox
    { appId: appMap.firefox, sourceId: sourceMap.flatpak, identifier: 'org.mozilla.firefox', isAvailable: true },
    { appId: appMap.firefox, sourceId: sourceMap.snap, identifier: 'firefox', isAvailable: true },
    { appId: appMap.firefox, sourceId: sourceMap.apt, identifier: 'firefox', isAvailable: true },
    { appId: appMap.firefox, sourceId: sourceMap.dnf, identifier: 'firefox', isAvailable: true },
    { appId: appMap.firefox, sourceId: sourceMap.pacman, identifier: 'firefox', isAvailable: true },

    // Chrome
    { appId: appMap.chrome, sourceId: sourceMap.flatpak, identifier: 'com.google.Chrome', isAvailable: true },
    { appId: appMap.chrome, sourceId: sourceMap.apt, identifier: 'google-chrome-stable', isAvailable: true },
    { appId: appMap.chrome, sourceId: sourceMap.dnf, identifier: 'google-chrome-stable', isAvailable: true },

    // Brave
    { appId: appMap.brave, sourceId: sourceMap.flatpak, identifier: 'com.brave.Browser', isAvailable: true },
    { appId: appMap.brave, sourceId: sourceMap.snap, identifier: 'brave', isAvailable: true },
    { appId: appMap.brave, sourceId: sourceMap.apt, identifier: 'brave-browser', isAvailable: true },
    { appId: appMap.brave, sourceId: sourceMap.dnf, identifier: 'brave-browser', isAvailable: true },
    { appId: appMap.brave, sourceId: sourceMap.pacman, identifier: 'brave-bin', isAvailable: true },

    // Chromium
    { appId: appMap.chromium, sourceId: sourceMap.flatpak, identifier: 'org.chromium.Chromium', isAvailable: true },
    { appId: appMap.chromium, sourceId: sourceMap.snap, identifier: 'chromium', isAvailable: true },
    { appId: appMap.chromium, sourceId: sourceMap.apt, identifier: 'chromium-browser', isAvailable: true },
    { appId: appMap.chromium, sourceId: sourceMap.dnf, identifier: 'chromium', isAvailable: true },
    { appId: appMap.chromium, sourceId: sourceMap.pacman, identifier: 'chromium', isAvailable: true },

    // Vivaldi
    { appId: appMap.vivaldi, sourceId: sourceMap.flatpak, identifier: 'com.vivaldi.Vivaldi', isAvailable: true },
    { appId: appMap.vivaldi, sourceId: sourceMap.snap, identifier: 'vivaldi', isAvailable: true },
    { appId: appMap.vivaldi, sourceId: sourceMap.apt, identifier: 'vivaldi-stable', isAvailable: true },
    { appId: appMap.vivaldi, sourceId: sourceMap.dnf, identifier: 'vivaldi-stable', isAvailable: true },

    // === DEVELOPMENT ===
    // VS Code
    { appId: appMap.vscode, sourceId: sourceMap.flatpak, identifier: 'com.visualstudio.code', isAvailable: true },
    { appId: appMap.vscode, sourceId: sourceMap.snap, identifier: 'code', isAvailable: true },
    { appId: appMap.vscode, sourceId: sourceMap.apt, identifier: 'code', isAvailable: true },
    { appId: appMap.vscode, sourceId: sourceMap.dnf, identifier: 'code', isAvailable: true },
    { appId: appMap.vscode, sourceId: sourceMap.pacman, identifier: 'visual-studio-code-bin', isAvailable: true },

    // Git (native only)
    { appId: appMap.git, sourceId: sourceMap.apt, identifier: 'git', isAvailable: true },
    { appId: appMap.git, sourceId: sourceMap.dnf, identifier: 'git', isAvailable: true },
    { appId: appMap.git, sourceId: sourceMap.pacman, identifier: 'git', isAvailable: true },
    { appId: appMap.git, sourceId: sourceMap.zypper, identifier: 'git', isAvailable: true },

    // Docker
    { appId: appMap.docker, sourceId: sourceMap.snap, identifier: 'docker', isAvailable: true },
    { appId: appMap.docker, sourceId: sourceMap.apt, identifier: 'docker.io', isAvailable: true },
    { appId: appMap.docker, sourceId: sourceMap.dnf, identifier: 'docker', isAvailable: true },
    { appId: appMap.docker, sourceId: sourceMap.pacman, identifier: 'docker', isAvailable: true },

    // Node.js
    { appId: appMap.nodejs, sourceId: sourceMap.snap, identifier: 'node', isAvailable: true },
    { appId: appMap.nodejs, sourceId: sourceMap.apt, identifier: 'nodejs', isAvailable: true },
    { appId: appMap.nodejs, sourceId: sourceMap.dnf, identifier: 'nodejs', isAvailable: true },
    { appId: appMap.nodejs, sourceId: sourceMap.pacman, identifier: 'nodejs', isAvailable: true },

    // IntelliJ IDEA
    { appId: appMap.intellij, sourceId: sourceMap.flatpak, identifier: 'com.jetbrains.IntelliJ-IDEA-Community', isAvailable: true },
    { appId: appMap.intellij, sourceId: sourceMap.snap, identifier: 'intellij-idea-community', isAvailable: true },
    { appId: appMap.intellij, sourceId: sourceMap.pacman, identifier: 'intellij-idea-community-edition', isAvailable: true },

    // Postman
    { appId: appMap.postman, sourceId: sourceMap.flatpak, identifier: 'com.getpostman.Postman', isAvailable: true },
    { appId: appMap.postman, sourceId: sourceMap.snap, identifier: 'postman', isAvailable: true },
    { appId: appMap.postman, sourceId: sourceMap.pacman, identifier: 'postman-bin', isAvailable: true },

    // DBeaver
    { appId: appMap.dbeaver, sourceId: sourceMap.flatpak, identifier: 'io.dbeaver.DBeaverCommunity', isAvailable: true },
    { appId: appMap.dbeaver, sourceId: sourceMap.snap, identifier: 'dbeaver-ce', isAvailable: true },
    { appId: appMap.dbeaver, sourceId: sourceMap.apt, identifier: 'dbeaver-ce', isAvailable: true },
    { appId: appMap.dbeaver, sourceId: sourceMap.pacman, identifier: 'dbeaver', isAvailable: true },

    // === MEDIA ===
    // VLC
    { appId: appMap.vlc, sourceId: sourceMap.flatpak, identifier: 'org.videolan.VLC', isAvailable: true },
    { appId: appMap.vlc, sourceId: sourceMap.snap, identifier: 'vlc', isAvailable: true },
    { appId: appMap.vlc, sourceId: sourceMap.apt, identifier: 'vlc', isAvailable: true },
    { appId: appMap.vlc, sourceId: sourceMap.dnf, identifier: 'vlc', isAvailable: true },
    { appId: appMap.vlc, sourceId: sourceMap.pacman, identifier: 'vlc', isAvailable: true },

    // Spotify
    { appId: appMap.spotify, sourceId: sourceMap.flatpak, identifier: 'com.spotify.Client', isAvailable: true },
    { appId: appMap.spotify, sourceId: sourceMap.snap, identifier: 'spotify', isAvailable: true },
    { appId: appMap.spotify, sourceId: sourceMap.apt, identifier: 'spotify-client', isAvailable: true },
    { appId: appMap.spotify, sourceId: sourceMap.pacman, identifier: 'spotify-launcher', isAvailable: true },

    // OBS Studio
    { appId: appMap.obs, sourceId: sourceMap.flatpak, identifier: 'com.obsproject.Studio', isAvailable: true },
    { appId: appMap.obs, sourceId: sourceMap.snap, identifier: 'obs-studio', isAvailable: true },
    { appId: appMap.obs, sourceId: sourceMap.apt, identifier: 'obs-studio', isAvailable: true },
    { appId: appMap.obs, sourceId: sourceMap.dnf, identifier: 'obs-studio', isAvailable: true },
    { appId: appMap.obs, sourceId: sourceMap.pacman, identifier: 'obs-studio', isAvailable: true },

    // Kdenlive
    { appId: appMap.kdenlive, sourceId: sourceMap.flatpak, identifier: 'org.kde.kdenlive', isAvailable: true },
    { appId: appMap.kdenlive, sourceId: sourceMap.snap, identifier: 'kdenlive', isAvailable: true },
    { appId: appMap.kdenlive, sourceId: sourceMap.apt, identifier: 'kdenlive', isAvailable: true },
    { appId: appMap.kdenlive, sourceId: sourceMap.dnf, identifier: 'kdenlive', isAvailable: true },
    { appId: appMap.kdenlive, sourceId: sourceMap.pacman, identifier: 'kdenlive', isAvailable: true },

    // Audacity
    { appId: appMap.audacity, sourceId: sourceMap.flatpak, identifier: 'org.audacityteam.Audacity', isAvailable: true },
    { appId: appMap.audacity, sourceId: sourceMap.snap, identifier: 'audacity', isAvailable: true },
    { appId: appMap.audacity, sourceId: sourceMap.apt, identifier: 'audacity', isAvailable: true },
    { appId: appMap.audacity, sourceId: sourceMap.dnf, identifier: 'audacity', isAvailable: true },
    { appId: appMap.audacity, sourceId: sourceMap.pacman, identifier: 'audacity', isAvailable: true },

    // mpv
    { appId: appMap.mpv, sourceId: sourceMap.flatpak, identifier: 'io.mpv.Mpv', isAvailable: true },
    { appId: appMap.mpv, sourceId: sourceMap.apt, identifier: 'mpv', isAvailable: true },
    { appId: appMap.mpv, sourceId: sourceMap.dnf, identifier: 'mpv', isAvailable: true },
    { appId: appMap.mpv, sourceId: sourceMap.pacman, identifier: 'mpv', isAvailable: true },

    // HandBrake
    { appId: appMap.handbrake, sourceId: sourceMap.flatpak, identifier: 'fr.handbrake.ghb', isAvailable: true },
    { appId: appMap.handbrake, sourceId: sourceMap.apt, identifier: 'handbrake', isAvailable: true },
    { appId: appMap.handbrake, sourceId: sourceMap.dnf, identifier: 'handbrake', isAvailable: true },
    { appId: appMap.handbrake, sourceId: sourceMap.pacman, identifier: 'handbrake', isAvailable: true },

    // === GRAPHICS ===
    // GIMP
    { appId: appMap.gimp, sourceId: sourceMap.flatpak, identifier: 'org.gimp.GIMP', isAvailable: true },
    { appId: appMap.gimp, sourceId: sourceMap.snap, identifier: 'gimp', isAvailable: true },
    { appId: appMap.gimp, sourceId: sourceMap.apt, identifier: 'gimp', isAvailable: true },
    { appId: appMap.gimp, sourceId: sourceMap.dnf, identifier: 'gimp', isAvailable: true },
    { appId: appMap.gimp, sourceId: sourceMap.pacman, identifier: 'gimp', isAvailable: true },

    // Inkscape
    { appId: appMap.inkscape, sourceId: sourceMap.flatpak, identifier: 'org.inkscape.Inkscape', isAvailable: true },
    { appId: appMap.inkscape, sourceId: sourceMap.snap, identifier: 'inkscape', isAvailable: true },
    { appId: appMap.inkscape, sourceId: sourceMap.apt, identifier: 'inkscape', isAvailable: true },
    { appId: appMap.inkscape, sourceId: sourceMap.dnf, identifier: 'inkscape', isAvailable: true },
    { appId: appMap.inkscape, sourceId: sourceMap.pacman, identifier: 'inkscape', isAvailable: true },

    // Blender
    { appId: appMap.blender, sourceId: sourceMap.flatpak, identifier: 'org.blender.Blender', isAvailable: true },
    { appId: appMap.blender, sourceId: sourceMap.snap, identifier: 'blender', isAvailable: true },
    { appId: appMap.blender, sourceId: sourceMap.apt, identifier: 'blender', isAvailable: true },
    { appId: appMap.blender, sourceId: sourceMap.dnf, identifier: 'blender', isAvailable: true },
    { appId: appMap.blender, sourceId: sourceMap.pacman, identifier: 'blender', isAvailable: true },

    // Krita
    { appId: appMap.krita, sourceId: sourceMap.flatpak, identifier: 'org.kde.krita', isAvailable: true },
    { appId: appMap.krita, sourceId: sourceMap.snap, identifier: 'krita', isAvailable: true },
    { appId: appMap.krita, sourceId: sourceMap.apt, identifier: 'krita', isAvailable: true },
    { appId: appMap.krita, sourceId: sourceMap.dnf, identifier: 'krita', isAvailable: true },
    { appId: appMap.krita, sourceId: sourceMap.pacman, identifier: 'krita', isAvailable: true },

    // darktable
    { appId: appMap.darktable, sourceId: sourceMap.flatpak, identifier: 'org.darktable.Darktable', isAvailable: true },
    { appId: appMap.darktable, sourceId: sourceMap.apt, identifier: 'darktable', isAvailable: true },
    { appId: appMap.darktable, sourceId: sourceMap.dnf, identifier: 'darktable', isAvailable: true },
    { appId: appMap.darktable, sourceId: sourceMap.pacman, identifier: 'darktable', isAvailable: true },

    // === OFFICE ===
    // LibreOffice
    { appId: appMap.libreoffice, sourceId: sourceMap.flatpak, identifier: 'org.libreoffice.LibreOffice', isAvailable: true },
    { appId: appMap.libreoffice, sourceId: sourceMap.snap, identifier: 'libreoffice', isAvailable: true },
    { appId: appMap.libreoffice, sourceId: sourceMap.apt, identifier: 'libreoffice', isAvailable: true },
    { appId: appMap.libreoffice, sourceId: sourceMap.dnf, identifier: 'libreoffice', isAvailable: true },
    { appId: appMap.libreoffice, sourceId: sourceMap.pacman, identifier: 'libreoffice-fresh', isAvailable: true },

    // ONLYOFFICE
    { appId: appMap.onlyoffice, sourceId: sourceMap.flatpak, identifier: 'org.onlyoffice.desktopeditors', isAvailable: true },
    { appId: appMap.onlyoffice, sourceId: sourceMap.snap, identifier: 'onlyoffice-desktopeditors', isAvailable: true },
    { appId: appMap.onlyoffice, sourceId: sourceMap.apt, identifier: 'onlyoffice-desktopeditors', isAvailable: true },

    // Obsidian
    { appId: appMap.obsidian, sourceId: sourceMap.flatpak, identifier: 'md.obsidian.Obsidian', isAvailable: true },
    { appId: appMap.obsidian, sourceId: sourceMap.snap, identifier: 'obsidian', isAvailable: true },
    { appId: appMap.obsidian, sourceId: sourceMap.pacman, identifier: 'obsidian', isAvailable: true },

    // Notion
    { appId: appMap.notion, sourceId: sourceMap.snap, identifier: 'notion-snap-reborn', isAvailable: true },
    { appId: appMap.notion, sourceId: sourceMap.pacman, identifier: 'notion-app', isAvailable: true },

    // === UTILITIES ===
    // FileZilla
    { appId: appMap.filezilla, sourceId: sourceMap.flatpak, identifier: 'org.filezillaproject.Filezilla', isAvailable: true },
    { appId: appMap.filezilla, sourceId: sourceMap.snap, identifier: 'filezilla', isAvailable: true },
    { appId: appMap.filezilla, sourceId: sourceMap.apt, identifier: 'filezilla', isAvailable: true },
    { appId: appMap.filezilla, sourceId: sourceMap.dnf, identifier: 'filezilla', isAvailable: true },
    { appId: appMap.filezilla, sourceId: sourceMap.pacman, identifier: 'filezilla', isAvailable: true },

    // Flameshot
    { appId: appMap.flameshot, sourceId: sourceMap.flatpak, identifier: 'org.flameshot.Flameshot', isAvailable: true },
    { appId: appMap.flameshot, sourceId: sourceMap.apt, identifier: 'flameshot', isAvailable: true },
    { appId: appMap.flameshot, sourceId: sourceMap.dnf, identifier: 'flameshot', isAvailable: true },
    { appId: appMap.flameshot, sourceId: sourceMap.pacman, identifier: 'flameshot', isAvailable: true },

    // Timeshift
    { appId: appMap.timeshift, sourceId: sourceMap.apt, identifier: 'timeshift', isAvailable: true },
    { appId: appMap.timeshift, sourceId: sourceMap.dnf, identifier: 'timeshift', isAvailable: true },
    { appId: appMap.timeshift, sourceId: sourceMap.pacman, identifier: 'timeshift', isAvailable: true },

    // Syncthing
    { appId: appMap.syncthing, sourceId: sourceMap.flatpak, identifier: 'me.kozec.syncthingtk', isAvailable: true },
    { appId: appMap.syncthing, sourceId: sourceMap.apt, identifier: 'syncthing', isAvailable: true },
    { appId: appMap.syncthing, sourceId: sourceMap.dnf, identifier: 'syncthing', isAvailable: true },
    { appId: appMap.syncthing, sourceId: sourceMap.pacman, identifier: 'syncthing', isAvailable: true },

    // balenaEtcher
    { appId: appMap['balena-etcher'], sourceId: sourceMap.flatpak, identifier: 'io.balena.Etcher', isAvailable: true },
    { appId: appMap['balena-etcher'], sourceId: sourceMap.pacman, identifier: 'balena-etcher', isAvailable: true },

    // === COMMUNICATION ===
    // Discord
    { appId: appMap.discord, sourceId: sourceMap.flatpak, identifier: 'com.discordapp.Discord', isAvailable: true },
    { appId: appMap.discord, sourceId: sourceMap.snap, identifier: 'discord', isAvailable: true },
    { appId: appMap.discord, sourceId: sourceMap.apt, identifier: 'discord', isAvailable: true },
    { appId: appMap.discord, sourceId: sourceMap.pacman, identifier: 'discord', isAvailable: true },

    // Slack
    { appId: appMap.slack, sourceId: sourceMap.flatpak, identifier: 'com.slack.Slack', isAvailable: true },
    { appId: appMap.slack, sourceId: sourceMap.snap, identifier: 'slack', isAvailable: true },
    { appId: appMap.slack, sourceId: sourceMap.apt, identifier: 'slack-desktop', isAvailable: true },
    { appId: appMap.slack, sourceId: sourceMap.dnf, identifier: 'slack', isAvailable: true },
    { appId: appMap.slack, sourceId: sourceMap.pacman, identifier: 'slack-desktop', isAvailable: true },

    // Thunderbird
    { appId: appMap.thunderbird, sourceId: sourceMap.flatpak, identifier: 'org.mozilla.Thunderbird', isAvailable: true },
    { appId: appMap.thunderbird, sourceId: sourceMap.snap, identifier: 'thunderbird', isAvailable: true },
    { appId: appMap.thunderbird, sourceId: sourceMap.apt, identifier: 'thunderbird', isAvailable: true },
    { appId: appMap.thunderbird, sourceId: sourceMap.dnf, identifier: 'thunderbird', isAvailable: true },
    { appId: appMap.thunderbird, sourceId: sourceMap.pacman, identifier: 'thunderbird', isAvailable: true },

    // Telegram
    { appId: appMap.telegram, sourceId: sourceMap.flatpak, identifier: 'org.telegram.desktop', isAvailable: true },
    { appId: appMap.telegram, sourceId: sourceMap.snap, identifier: 'telegram-desktop', isAvailable: true },
    { appId: appMap.telegram, sourceId: sourceMap.apt, identifier: 'telegram-desktop', isAvailable: true },
    { appId: appMap.telegram, sourceId: sourceMap.dnf, identifier: 'telegram-desktop', isAvailable: true },
    { appId: appMap.telegram, sourceId: sourceMap.pacman, identifier: 'telegram-desktop', isAvailable: true },

    // Zoom
    { appId: appMap.zoom, sourceId: sourceMap.flatpak, identifier: 'us.zoom.Zoom', isAvailable: true },
    { appId: appMap.zoom, sourceId: sourceMap.snap, identifier: 'zoom-client', isAvailable: true },
    { appId: appMap.zoom, sourceId: sourceMap.apt, identifier: 'zoom', isAvailable: true },
    { appId: appMap.zoom, sourceId: sourceMap.dnf, identifier: 'zoom', isAvailable: true },
    { appId: appMap.zoom, sourceId: sourceMap.pacman, identifier: 'zoom', isAvailable: true },

    // Skype
    { appId: appMap.skype, sourceId: sourceMap.flatpak, identifier: 'com.skype.Client', isAvailable: true },
    { appId: appMap.skype, sourceId: sourceMap.snap, identifier: 'skype', isAvailable: true },
    { appId: appMap.skype, sourceId: sourceMap.apt, identifier: 'skypeforlinux', isAvailable: true },
    { appId: appMap.skype, sourceId: sourceMap.dnf, identifier: 'skypeforlinux', isAvailable: true },

    // === GAMES ===
    // Steam
    { appId: appMap.steam, sourceId: sourceMap.flatpak, identifier: 'com.valvesoftware.Steam', isAvailable: true },
    { appId: appMap.steam, sourceId: sourceMap.snap, identifier: 'steam', isAvailable: true },
    { appId: appMap.steam, sourceId: sourceMap.apt, identifier: 'steam', isAvailable: true },
    { appId: appMap.steam, sourceId: sourceMap.dnf, identifier: 'steam', isAvailable: true },
    { appId: appMap.steam, sourceId: sourceMap.pacman, identifier: 'steam', isAvailable: true },

    // Lutris
    { appId: appMap.lutris, sourceId: sourceMap.flatpak, identifier: 'net.lutris.Lutris', isAvailable: true },
    { appId: appMap.lutris, sourceId: sourceMap.apt, identifier: 'lutris', isAvailable: true },
    { appId: appMap.lutris, sourceId: sourceMap.dnf, identifier: 'lutris', isAvailable: true },
    { appId: appMap.lutris, sourceId: sourceMap.pacman, identifier: 'lutris', isAvailable: true },

    // Minecraft
    { appId: appMap.minecraft, sourceId: sourceMap.flatpak, identifier: 'com.mojang.Minecraft', isAvailable: true },
    { appId: appMap.minecraft, sourceId: sourceMap.pacman, identifier: 'minecraft-launcher', isAvailable: true },

    // Heroic Games Launcher
    { appId: appMap.heroic, sourceId: sourceMap.flatpak, identifier: 'com.heroicgameslauncher.hgl', isAvailable: true },
    { appId: appMap.heroic, sourceId: sourceMap.pacman, identifier: 'heroic-games-launcher-bin', isAvailable: true },

    // === SECURITY ===
    // KeePassXC
    { appId: appMap.keepassxc, sourceId: sourceMap.flatpak, identifier: 'org.keepassxc.KeePassXC', isAvailable: true },
    { appId: appMap.keepassxc, sourceId: sourceMap.snap, identifier: 'keepassxc', isAvailable: true },
    { appId: appMap.keepassxc, sourceId: sourceMap.apt, identifier: 'keepassxc', isAvailable: true },
    { appId: appMap.keepassxc, sourceId: sourceMap.dnf, identifier: 'keepassxc', isAvailable: true },
    { appId: appMap.keepassxc, sourceId: sourceMap.pacman, identifier: 'keepassxc', isAvailable: true },

    // Bitwarden
    { appId: appMap.bitwarden, sourceId: sourceMap.flatpak, identifier: 'com.bitwarden.desktop', isAvailable: true },
    { appId: appMap.bitwarden, sourceId: sourceMap.snap, identifier: 'bitwarden', isAvailable: true },
    { appId: appMap.bitwarden, sourceId: sourceMap.pacman, identifier: 'bitwarden', isAvailable: true },

    // VeraCrypt
    { appId: appMap.veracrypt, sourceId: sourceMap.apt, identifier: 'veracrypt', isAvailable: true },
    { appId: appMap.veracrypt, sourceId: sourceMap.dnf, identifier: 'veracrypt', isAvailable: true },
    { appId: appMap.veracrypt, sourceId: sourceMap.pacman, identifier: 'veracrypt', isAvailable: true },

    // ClamAV
    { appId: appMap.clamav, sourceId: sourceMap.apt, identifier: 'clamav', isAvailable: true },
    { appId: appMap.clamav, sourceId: sourceMap.dnf, identifier: 'clamav', isAvailable: true },
    { appId: appMap.clamav, sourceId: sourceMap.pacman, identifier: 'clamav', isAvailable: true },

    // === SYSTEM ===

    // btop
    { appId: appMap.btop, sourceId: sourceMap.apt, identifier: 'btop', isAvailable: true },
    { appId: appMap.btop, sourceId: sourceMap.dnf, identifier: 'btop', isAvailable: true },
    { appId: appMap.btop, sourceId: sourceMap.pacman, identifier: 'btop', isAvailable: true },

    // ===== WINDOWS PACKAGES =====
    // Browsers
    { appId: appMap.firefox, sourceId: sourceMap.winget, identifier: 'Mozilla.Firefox', isAvailable: true },
    { appId: appMap.firefox, sourceId: sourceMap.choco, identifier: 'firefox', isAvailable: true },
    { appId: appMap.firefox, sourceId: sourceMap.scoop, identifier: 'firefox', isAvailable: true },

    { appId: appMap.chrome, sourceId: sourceMap.winget, identifier: 'Google.Chrome', isAvailable: true },
    { appId: appMap.chrome, sourceId: sourceMap.choco, identifier: 'googlechrome', isAvailable: true },
    { appId: appMap.chrome, sourceId: sourceMap.scoop, identifier: 'googlechrome', isAvailable: true },

    { appId: appMap.brave, sourceId: sourceMap.winget, identifier: 'Brave.Brave', isAvailable: true },
    { appId: appMap.brave, sourceId: sourceMap.choco, identifier: 'brave', isAvailable: true },
    { appId: appMap.brave, sourceId: sourceMap.scoop, identifier: 'brave', isAvailable: true },

    { appId: appMap.chromium, sourceId: sourceMap.winget, identifier: 'Hibbiki.Chromium', isAvailable: true },
    { appId: appMap.chromium, sourceId: sourceMap.choco, identifier: 'chromium', isAvailable: true },
    { appId: appMap.chromium, sourceId: sourceMap.scoop, identifier: 'chromium', isAvailable: true },

    { appId: appMap.vivaldi, sourceId: sourceMap.winget, identifier: 'VivaldiTechnologies.Vivaldi', isAvailable: true },
    { appId: appMap.vivaldi, sourceId: sourceMap.choco, identifier: 'vivaldi', isAvailable: true },

    // Development
    { appId: appMap.vscode, sourceId: sourceMap.winget, identifier: 'Microsoft.VisualStudioCode', isAvailable: true },
    { appId: appMap.vscode, sourceId: sourceMap.choco, identifier: 'vscode', isAvailable: true },
    { appId: appMap.vscode, sourceId: sourceMap.scoop, identifier: 'vscode', isAvailable: true },

    { appId: appMap.git, sourceId: sourceMap.winget, identifier: 'Git.Git', isAvailable: true },
    { appId: appMap.git, sourceId: sourceMap.choco, identifier: 'git', isAvailable: true },
    { appId: appMap.git, sourceId: sourceMap.scoop, identifier: 'git', isAvailable: true },

    { appId: appMap.docker, sourceId: sourceMap.winget, identifier: 'Docker.DockerDesktop', isAvailable: true },
    { appId: appMap.docker, sourceId: sourceMap.choco, identifier: 'docker-desktop', isAvailable: true },
    { appId: appMap.docker, sourceId: sourceMap.scoop, identifier: 'docker', isAvailable: true },

    { appId: appMap.nodejs, sourceId: sourceMap.winget, identifier: 'OpenJS.NodeJS', isAvailable: true },
    { appId: appMap.nodejs, sourceId: sourceMap.choco, identifier: 'nodejs', isAvailable: true },
    { appId: appMap.nodejs, sourceId: sourceMap.scoop, identifier: 'nodejs', isAvailable: true },

    { appId: appMap.intellij, sourceId: sourceMap.winget, identifier: 'JetBrains.IntelliJIDEA.Community', isAvailable: true },
    { appId: appMap.intellij, sourceId: sourceMap.choco, identifier: 'intellijidea-community', isAvailable: true },
    { appId: appMap.intellij, sourceId: sourceMap.scoop, identifier: 'idea', isAvailable: true },

    { appId: appMap.postman, sourceId: sourceMap.winget, identifier: 'Postman.Postman', isAvailable: true },
    { appId: appMap.postman, sourceId: sourceMap.choco, identifier: 'postman', isAvailable: true },
    { appId: appMap.postman, sourceId: sourceMap.scoop, identifier: 'postman', isAvailable: true },

    { appId: appMap.dbeaver, sourceId: sourceMap.winget, identifier: 'dbeaver.dbeaver', isAvailable: true },
    { appId: appMap.dbeaver, sourceId: sourceMap.choco, identifier: 'dbeaver', isAvailable: true },
    { appId: appMap.dbeaver, sourceId: sourceMap.scoop, identifier: 'dbeaver', isAvailable: true },

    // Media
    { appId: appMap.vlc, sourceId: sourceMap.winget, identifier: 'VideoLAN.VLC', isAvailable: true },
    { appId: appMap.vlc, sourceId: sourceMap.choco, identifier: 'vlc', isAvailable: true },
    { appId: appMap.vlc, sourceId: sourceMap.scoop, identifier: 'vlc', isAvailable: true },

    { appId: appMap.spotify, sourceId: sourceMap.winget, identifier: 'Spotify.Spotify', isAvailable: true },
    { appId: appMap.spotify, sourceId: sourceMap.choco, identifier: 'spotify', isAvailable: true },
    { appId: appMap.spotify, sourceId: sourceMap.scoop, identifier: 'spotify', isAvailable: true },

    { appId: appMap.obs, sourceId: sourceMap.winget, identifier: 'OBSProject.OBSStudio', isAvailable: true },
    { appId: appMap.obs, sourceId: sourceMap.choco, identifier: 'obs-studio', isAvailable: true },
    { appId: appMap.obs, sourceId: sourceMap.scoop, identifier: 'obs-studio', isAvailable: true },

    { appId: appMap.kdenlive, sourceId: sourceMap.winget, identifier: 'KDE.Kdenlive', isAvailable: true },
    { appId: appMap.kdenlive, sourceId: sourceMap.choco, identifier: 'kdenlive', isAvailable: true },

    { appId: appMap.audacity, sourceId: sourceMap.winget, identifier: 'Audacity.Audacity', isAvailable: true },
    { appId: appMap.audacity, sourceId: sourceMap.choco, identifier: 'audacity', isAvailable: true },
    { appId: appMap.audacity, sourceId: sourceMap.scoop, identifier: 'audacity', isAvailable: true },

    { appId: appMap.mpv, sourceId: sourceMap.winget, identifier: 'mpv.mpv', isAvailable: true },
    { appId: appMap.mpv, sourceId: sourceMap.choco, identifier: 'mpv', isAvailable: true },
    { appId: appMap.mpv, sourceId: sourceMap.scoop, identifier: 'mpv', isAvailable: true },

    { appId: appMap.handbrake, sourceId: sourceMap.winget, identifier: 'HandBrake.HandBrake', isAvailable: true },
    { appId: appMap.handbrake, sourceId: sourceMap.choco, identifier: 'handbrake', isAvailable: true },
    { appId: appMap.handbrake, sourceId: sourceMap.scoop, identifier: 'handbrake', isAvailable: true },

    // Graphics
    { appId: appMap.gimp, sourceId: sourceMap.winget, identifier: 'GIMP.GIMP', isAvailable: true },
    { appId: appMap.gimp, sourceId: sourceMap.choco, identifier: 'gimp', isAvailable: true },
    { appId: appMap.gimp, sourceId: sourceMap.scoop, identifier: 'gimp', isAvailable: true },

    { appId: appMap.inkscape, sourceId: sourceMap.winget, identifier: 'Inkscape.Inkscape', isAvailable: true },
    { appId: appMap.inkscape, sourceId: sourceMap.choco, identifier: 'inkscape', isAvailable: true },
    { appId: appMap.inkscape, sourceId: sourceMap.scoop, identifier: 'inkscape', isAvailable: true },

    { appId: appMap.blender, sourceId: sourceMap.winget, identifier: 'BlenderFoundation.Blender', isAvailable: true },
    { appId: appMap.blender, sourceId: sourceMap.choco, identifier: 'blender', isAvailable: true },
    { appId: appMap.blender, sourceId: sourceMap.scoop, identifier: 'blender', isAvailable: true },

    { appId: appMap.krita, sourceId: sourceMap.winget, identifier: 'KDE.Krita', isAvailable: true },
    { appId: appMap.krita, sourceId: sourceMap.choco, identifier: 'krita', isAvailable: true },
    { appId: appMap.krita, sourceId: sourceMap.scoop, identifier: 'krita', isAvailable: true },

    { appId: appMap.darktable, sourceId: sourceMap.winget, identifier: 'darktable.darktable', isAvailable: true },
    { appId: appMap.darktable, sourceId: sourceMap.choco, identifier: 'darktable', isAvailable: true },

    // Office
    { appId: appMap.libreoffice, sourceId: sourceMap.winget, identifier: 'TheDocumentFoundation.LibreOffice', isAvailable: true },
    { appId: appMap.libreoffice, sourceId: sourceMap.choco, identifier: 'libreoffice-fresh', isAvailable: true },
    { appId: appMap.libreoffice, sourceId: sourceMap.scoop, identifier: 'libreoffice', isAvailable: true },

    { appId: appMap.onlyoffice, sourceId: sourceMap.winget, identifier: 'ONLYOFFICE.DesktopEditors', isAvailable: true },
    { appId: appMap.onlyoffice, sourceId: sourceMap.choco, identifier: 'onlyoffice', isAvailable: true },

    { appId: appMap.obsidian, sourceId: sourceMap.winget, identifier: 'Obsidian.Obsidian', isAvailable: true },
    { appId: appMap.obsidian, sourceId: sourceMap.choco, identifier: 'obsidian', isAvailable: true },
    { appId: appMap.obsidian, sourceId: sourceMap.scoop, identifier: 'obsidian', isAvailable: true },

    { appId: appMap.notion, sourceId: sourceMap.winget, identifier: 'Notion.Notion', isAvailable: true },
    { appId: appMap.notion, sourceId: sourceMap.choco, identifier: 'notion', isAvailable: true },
    { appId: appMap.notion, sourceId: sourceMap.scoop, identifier: 'notion', isAvailable: true },

    // Utilities
    { appId: appMap.syncthing, sourceId: sourceMap.winget, identifier: 'Syncthing.Syncthing', isAvailable: true },
    { appId: appMap.syncthing, sourceId: sourceMap.choco, identifier: 'syncthing', isAvailable: true },
    { appId: appMap.syncthing, sourceId: sourceMap.scoop, identifier: 'syncthing', isAvailable: true },

    { appId: appMap['balena-etcher'], sourceId: sourceMap.winget, identifier: 'Balena.Etcher', isAvailable: true },
    { appId: appMap['balena-etcher'], sourceId: sourceMap.choco, identifier: 'etcher', isAvailable: true },
    { appId: appMap['balena-etcher'], sourceId: sourceMap.scoop, identifier: 'etcher', isAvailable: true },

    // Communication
    { appId: appMap.discord, sourceId: sourceMap.winget, identifier: 'Discord.Discord', isAvailable: true },
    { appId: appMap.discord, sourceId: sourceMap.choco, identifier: 'discord', isAvailable: true },
    { appId: appMap.discord, sourceId: sourceMap.scoop, identifier: 'discord', isAvailable: true },

    { appId: appMap.slack, sourceId: sourceMap.winget, identifier: 'SlackTechnologies.Slack', isAvailable: true },
    { appId: appMap.slack, sourceId: sourceMap.choco, identifier: 'slack', isAvailable: true },
    { appId: appMap.slack, sourceId: sourceMap.scoop, identifier: 'slack', isAvailable: true },

    { appId: appMap.thunderbird, sourceId: sourceMap.winget, identifier: 'Mozilla.Thunderbird', isAvailable: true },
    { appId: appMap.thunderbird, sourceId: sourceMap.choco, identifier: 'thunderbird', isAvailable: true },
    { appId: appMap.thunderbird, sourceId: sourceMap.scoop, identifier: 'thunderbird', isAvailable: true },

    { appId: appMap.telegram, sourceId: sourceMap.winget, identifier: 'Telegram.TelegramDesktop', isAvailable: true },
    { appId: appMap.telegram, sourceId: sourceMap.choco, identifier: 'telegram', isAvailable: true },
    { appId: appMap.telegram, sourceId: sourceMap.scoop, identifier: 'telegram', isAvailable: true },

    { appId: appMap.zoom, sourceId: sourceMap.winget, identifier: 'Zoom.Zoom', isAvailable: true },
    { appId: appMap.zoom, sourceId: sourceMap.choco, identifier: 'zoom', isAvailable: true },
    { appId: appMap.zoom, sourceId: sourceMap.scoop, identifier: 'zoom', isAvailable: true },

    // Games
    { appId: appMap.steam, sourceId: sourceMap.winget, identifier: 'Valve.Steam', isAvailable: true },
    { appId: appMap.steam, sourceId: sourceMap.choco, identifier: 'steam', isAvailable: true },
    { appId: appMap.steam, sourceId: sourceMap.scoop, identifier: 'steam', isAvailable: true },

    { appId: appMap.minecraft, sourceId: sourceMap.winget, identifier: 'Mojang.MinecraftLauncher', isAvailable: true },
    { appId: appMap.minecraft, sourceId: sourceMap.choco, identifier: 'minecraft-launcher', isAvailable: true },

    { appId: appMap.heroic, sourceId: sourceMap.winget, identifier: 'HeroicGamesLauncher.HeroicGamesLauncher', isAvailable: true },
    { appId: appMap.heroic, sourceId: sourceMap.choco, identifier: 'heroic-games-launcher', isAvailable: true },
    { appId: appMap.heroic, sourceId: sourceMap.scoop, identifier: 'heroic', isAvailable: true },

    // Security
    { appId: appMap.keepassxc, sourceId: sourceMap.winget, identifier: 'KeePassXCTeam.KeePassXC', isAvailable: true },
    { appId: appMap.keepassxc, sourceId: sourceMap.choco, identifier: 'keepassxc', isAvailable: true },
    { appId: appMap.keepassxc, sourceId: sourceMap.scoop, identifier: 'keepassxc', isAvailable: true },

    { appId: appMap.bitwarden, sourceId: sourceMap.winget, identifier: 'Bitwarden.Bitwarden', isAvailable: true },
    { appId: appMap.bitwarden, sourceId: sourceMap.choco, identifier: 'bitwarden', isAvailable: true },
    { appId: appMap.bitwarden, sourceId: sourceMap.scoop, identifier: 'bitwarden', isAvailable: true },

    { appId: appMap.veracrypt, sourceId: sourceMap.winget, identifier: 'IDRIX.VeraCrypt', isAvailable: true },
    { appId: appMap.veracrypt, sourceId: sourceMap.choco, identifier: 'veracrypt', isAvailable: true },
    { appId: appMap.veracrypt, sourceId: sourceMap.scoop, identifier: 'veracrypt', isAvailable: true },
  ];

  await db.insert(packages).values(packagesData);
  console.log(`✅ Created ${packagesData.length} packages`);

  console.log('\n✅ Database seeded successfully!');
  console.log('\n🚀 You can now start the dev server with: bun run dev');
  console.log('\n📝 Note: Sign in with GitHub OAuth at /admin/login');
  console.log('   Only sagyamthapa32@gmail.com will be granted superadmin role');
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
