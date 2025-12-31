/**
 * Test Flathub API directly
 */

import { getFlathubAppMetadata } from '../src/services/external-apis/flathub';

async function testFlathubAPI() {
  console.log('Testing Flathub API for Firefox...\n');

  try {
    const metadata = await getFlathubAppMetadata('org.mozilla.firefox');

    if (metadata) {
      console.log('✅ Metadata fetched successfully:');
      console.log(JSON.stringify(metadata, null, 2));
    } else {
      console.log('❌ No metadata returned');
    }
  } catch (error) {
    console.error('❌ Error fetching metadata:', error);
  }

  process.exit(0);
}

testFlathubAPI().catch(console.error);
