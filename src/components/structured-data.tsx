/**
 * Structured Data (JSON-LD) for SEO
 * Helps search engines understand the content better
 */

export function StructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Linite',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Linux',
    description:
      'Select apps from our curated catalog and generate a single command to install everything on your Linux distribution. Supports apt, dnf, pacman, Flatpak, Snap, and more.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Curated app catalog',
      'Support for multiple Linux distributions',
      'Support for multiple package managers',
      'Single command installation',
      'Flatpak support',
      'Snap support',
      'AUR support',
    ],
    softwareRequirements: 'Linux operating system',
    permissions: 'sudo access for package installation',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
