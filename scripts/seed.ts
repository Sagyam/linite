import { db, categories, sources, distros, distroSources, apps, packages, user, account } from '../src/db';

async function seed() {
  console.log('🌱 Seeding database...');

  // 1. Create admin user
  console.log('Creating admin user...');
  const [adminUser] = await db.insert(user).values({
    email: 'admin@linite.local',
    name: 'Admin User',
    emailVerified: true,
    role: 'superadmin',
  }).returning();

  await db.insert(account).values({
    userId: adminUser.id,
    accountId: adminUser.id,
    providerId: 'credential',
    password: '$2a$10$rKXN5qYwXqY.kXJx4BoOyO.zF8vC8bqH9kbYkUJZ0a8XqKoK0qK0K', // Password: admin123
  });

  console.log('✅ Admin user created (email: admin@linite.local, password: admin123)');

  // 2. Create categories
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

  // 3. Create sources
  console.log('Creating sources...');
  const sourcesData = [
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
  ];

  const createdSources = await db.insert(sources).values(sourcesData).returning();
  console.log(`✅ Created ${createdSources.length} sources`);

  // 4. Create distros
  console.log('Creating distros...');
  const distrosData = [
    { name: 'Ubuntu', slug: 'ubuntu', family: 'debian', basedOn: 'debian', isPopular: true },
    { name: 'Debian', slug: 'debian', family: 'debian', basedOn: null, isPopular: true },
    { name: 'Linux Mint', slug: 'linuxmint', family: 'debian', basedOn: 'ubuntu', isPopular: true },
    { name: 'Pop!_OS', slug: 'pop', family: 'debian', basedOn: 'ubuntu', isPopular: true },
    { name: 'Fedora', slug: 'fedora', family: 'rhel', basedOn: null, isPopular: true },
    { name: 'Arch Linux', slug: 'arch', family: 'arch', basedOn: null, isPopular: true },
    { name: 'Manjaro', slug: 'manjaro', family: 'arch', basedOn: 'arch', isPopular: true },
    { name: 'openSUSE', slug: 'opensuse', family: 'suse', basedOn: null, isPopular: false },
  ];

  const createdDistros = await db.insert(distros).values(distrosData).returning();
  console.log(`✅ Created ${createdDistros.length} distros`);

  // 5. Map distros to sources
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
  ];

  await db.insert(distroSources).values(distroSourceMappings);
  console.log(`✅ Created ${distroSourceMappings.length} distro-source mappings`);

  // 6. Create sample apps
  console.log('Creating sample apps...');
  const categoryMap = Object.fromEntries(createdCategories.map(c => [c.slug, c.id]));

  const appsData = [
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
      slug: 'vscode',
      displayName: 'Visual Studio Code',
      description: 'Code editor redefined and optimized for building and debugging',
      homepage: 'https://code.visualstudio.com',
      isPopular: true,
      isFoss: false,
      categoryId: categoryMap.development,
    },
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
      slug: 'gimp',
      displayName: 'GIMP',
      description: 'GNU Image Manipulation Program',
      homepage: 'https://gimp.org',
      isPopular: true,
      isFoss: true,
      categoryId: categoryMap.graphics,
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
  ];

  const createdApps = await db.insert(apps).values(appsData).returning();
  console.log(`✅ Created ${createdApps.length} apps`);

  // 7. Create sample packages
  console.log('Creating sample packages...');
  const appMap = Object.fromEntries(createdApps.map(a => [a.slug, a.id]));

  const packagesData = [
    // Firefox
    { appId: appMap.firefox, sourceId: sourceMap.flatpak, identifier: 'org.mozilla.firefox', version: '120.0', isAvailable: true },
    { appId: appMap.firefox, sourceId: sourceMap.snap, identifier: 'firefox', isAvailable: true },
    { appId: appMap.firefox, sourceId: sourceMap.apt, identifier: 'firefox', isAvailable: true },

    // VS Code
    { appId: appMap.vscode, sourceId: sourceMap.flatpak, identifier: 'com.visualstudio.code', isAvailable: true },
    { appId: appMap.vscode, sourceId: sourceMap.snap, identifier: 'code', version: '1.85', isAvailable: true },
    { appId: appMap.vscode, sourceId: sourceMap.apt, identifier: 'code', isAvailable: true },

    // VLC
    { appId: appMap.vlc, sourceId: sourceMap.flatpak, identifier: 'org.videolan.VLC', isAvailable: true },
    { appId: appMap.vlc, sourceId: sourceMap.snap, identifier: 'vlc', isAvailable: true },
    { appId: appMap.vlc, sourceId: sourceMap.apt, identifier: 'vlc', isAvailable: true },

    // GIMP
    { appId: appMap.gimp, sourceId: sourceMap.flatpak, identifier: 'org.gimp.GIMP', isAvailable: true },
    { appId: appMap.gimp, sourceId: sourceMap.snap, identifier: 'gimp', isAvailable: true },
    { appId: appMap.gimp, sourceId: sourceMap.apt, identifier: 'gimp', isAvailable: true },

    // Git (native only)
    { appId: appMap.git, sourceId: sourceMap.apt, identifier: 'git', isAvailable: true },
    { appId: appMap.git, sourceId: sourceMap.dnf, identifier: 'git', isAvailable: true },
    { appId: appMap.git, sourceId: sourceMap.pacman, identifier: 'git', isAvailable: true },
  ];

  await db.insert(packages).values(packagesData);
  console.log(`✅ Created ${packagesData.length} packages`);

  console.log('\n✅ Database seeded successfully!');
  console.log('\n📝 Admin credentials:');
  console.log('   Email: admin@linite.local');
  console.log('   Password: admin123');
  console.log('\n🚀 You can now start the dev server with: bun run dev');
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
