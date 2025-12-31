/**
 * Test raw Flathub API response
 */

async function testFlathubRaw() {
  console.log('Fetching raw Flathub API response for Firefox...\n');

  try {
    const response = await fetch('https://flathub.org/api/v2/appstream/org.mozilla.firefox');

    if (!response.ok) {
      console.error(`API returned ${response.status}`);
      process.exit(1);
    }

    const data = await response.json();
    console.log('Raw API Response:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

testFlathubRaw().catch(console.error);
