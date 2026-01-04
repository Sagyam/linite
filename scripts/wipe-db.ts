import { db } from '../src/db';
import { sql } from 'drizzle-orm';
import { BlobServiceClient } from '@azure/storage-blob';
import { env } from '../src/lib/env';

/**
 * Wipe all blobs from Azure Blob Storage
 */
async function wipeAzureBlobs() {
  console.log('🗑️  Wiping Azure Blob Storage...');

  try {
    // Parse SAS URL
    const sasUrl = env.AZURE_STORAGE_SAS_URL;
    const url = new URL(sasUrl);
    const accountName = url.hostname.split('.')[0];
    const containerName = url.pathname.split('/')[1];
    const sasToken = url.search;

    // Create client
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net${sasToken}`
    );
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // List and delete all blobs
    let blobCount = 0;
    for await (const blob of containerClient.listBlobsFlat()) {
      if (blob.name) {
        await containerClient.deleteBlob(blob.name);
        blobCount++;
        console.log(`  ✓ Deleted ${blob.name}`);
      }
    }

    console.log(`✅ Deleted ${blobCount} blobs from Azure Blob Storage`);
  } catch (error) {
    console.error('❌ Failed to wipe Azure Blob Storage:', error);
    // Don't exit - continue with database wipe
  }
}

async function wipeDatabase() {
  // First, wipe Azure Blob Storage
  await wipeAzureBlobs();

  console.log('\n🗑️  Wiping database...');

  try {
    // Get all table names
    const tables = [
      'refresh_logs',
      'distro_sources',
      'packages',
      'apps',
      'sources',
      'distros',
      'categories',
      'verification',
      'account',
      'session',
      'user',
    ];

    // Delete all data from tables in reverse order (to respect foreign keys)
    for (const table of tables) {
      await db.run(sql.raw(`DELETE FROM ${table}`));
      console.log(`  ✓ Cleared ${table}`);
    }

    console.log('✅ Database wiped successfully!');
    console.log('💡 Run "bun run db:seed" to populate with initial data');
  } catch (error) {
    console.error('❌ Failed to wipe database:', error);
    process.exit(1);
  }

  process.exit(0);
}

wipeDatabase();
