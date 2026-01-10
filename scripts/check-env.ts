#!/usr/bin/env bun

/**
 * Environment variable validation script
 * Run this to check if all required environment variables are properly set
 *
 * This script imports the schema from src/lib/env.ts to ensure
 * validation is consistent between manual checks and runtime validation.
 */

import { envSchema } from '../src/lib/env';

console.log('🔍 Checking environment variables...\n');

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment validation failed!\n');

  const errors = parsed.error.format();

  // Display each error in a readable format
  Object.entries(errors).forEach(([key, value]) => {
    if (key !== '_errors' && value && typeof value === 'object' && '_errors' in value) {
      const fieldErrors = value._errors as string[];
      if (fieldErrors.length > 0) {
        console.error(`  ${key}:`);
        fieldErrors.forEach((error) => {
          console.error(`    ❌ ${error}`);
        });
        console.error('');
      }
    }
  });

  console.error('💡 Tips:');
  console.error('   1. Make sure you have a .env file in the project root');
  console.error('   2. Copy .env.example to .env if you haven\'t already');
  console.error('   3. Fill in all required values');
  console.error('   4. Make sure there are no typos in variable names\n');

  process.exit(1);
} else {
  console.log('✅ All environment variables are valid!\n');

  console.log('📋 Configuration summary:');
  console.log(`   Database: ${parsed.data.DATABASE_URL.substring(0, 30)}...`);
  console.log(`   Auth URL: ${parsed.data.BETTER_AUTH_URL}`);
  console.log(`   Azure Blob Storage: ${parsed.data.AZURE_STORAGE_SAS_URL ? '✅ Configured' : '❌ Not configured'}`);
  console.log('');

  console.log('🚀 You\'re ready to go!\n');
  process.exit(0);
}
