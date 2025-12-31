/**
 * Check what's in the metadata field
 */

import { db } from '../src/db';
import { packages, sources } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function checkMetadata() {
  // Get flatpak source
  const flatpakSource = await db.query.sources.findFirst({
    where: eq(sources.slug, 'flatpak'),
  });

  if (!flatpakSource) {
    console.log('Flatpak source not found');
    process.exit(1);
  }

  // Get a flatpak package
  const pkg = await db.query.packages.findFirst({
    where: eq(packages.sourceId, flatpakSource.id),
    with: {
      app: true,
      source: true,
    },
  });

  if (pkg) {
    console.log('Sample Flatpak package:');
    console.log(`App: ${pkg.app?.displayName}`);
    console.log(`Identifier: ${pkg.identifier}`);
    console.log(`Version: ${pkg.version}`);
    console.log(`Size: ${pkg.size}`);
    console.log(`Maintainer: ${pkg.maintainer}`);
    console.log(`Metadata:`);
    console.log(JSON.stringify(pkg.metadata, null, 2));
  }

  process.exit(0);
}

checkMetadata().catch(console.error);
