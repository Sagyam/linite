#!/usr/bin/env bun

/**
 * Environment variable validation script
 * Run this to check if all required environment variables are properly set
 */

import { z } from 'zod';

const envSchema = z.object({
  // Database - Required
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .refine(
      (url) => url.startsWith('libsql://') || url.startsWith('https://') || url.startsWith('http://'),
      'DATABASE_URL must start with libsql://, https://, or http:// (Turso URL)'
    ),
  DATABASE_AUTH_TOKEN: z
    .string()
    .min(1, 'DATABASE_AUTH_TOKEN is required for Turso')
    .optional(),

  // App URL
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('NEXT_PUBLIC_APP_URL must be a valid URL')
    .default('http://localhost:3000'),

  // BetterAuth - Required
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, 'BETTER_AUTH_SECRET must be at least 32 characters long'),
  BETTER_AUTH_URL: z
    .string()
    .url('BETTER_AUTH_URL must be a valid URL')
    .default('http://localhost:3000'),

  // GitHub OAuth - Required for admin login
  GITHUB_CLIENT_ID: z
    .string()
    .min(1, 'GITHUB_CLIENT_ID is required for GitHub OAuth'),
  GITHUB_CLIENT_SECRET: z
    .string()
    .min(1, 'GITHUB_CLIENT_SECRET is required for GitHub OAuth'),

  // Azure Blob Storage - Required for image uploads
  AZURE_STORAGE_SAS_URL: z
    .string()
    .url('AZURE_STORAGE_SAS_URL must be a valid URL')
    .min(1, 'AZURE_STORAGE_SAS_URL is required for image uploads'),

  // Cron secret
  CRON_SECRET: z
    .string()
    .min(16, 'CRON_SECRET should be at least 16 characters')
    .optional(),

  // Upstash Redis - Optional but recommended for production
  KV_REST_API_URL: z
    .string()
    .url('KV_REST_API_URL must be a valid URL')
    .optional(),
  KV_REST_API_TOKEN: z
    .string()
    .min(1)
    .optional(),

  // Node environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

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
  console.log(`   Rate Limiting: ${parsed.data.KV_REST_API_URL ? '✅ Configured' : '⚠️  Not configured (optional)'}`);
  console.log('');

  if (!parsed.data.KV_REST_API_URL) {
    console.log('⚠️  Note: Rate limiting is not configured. This is optional for development');
    console.log('   but recommended for production. Add KV_REST_API_URL and KV_REST_API_TOKEN');
    console.log('   from Upstash Redis to enable rate limiting.\n');
  }

  console.log('🚀 You\'re ready to go!\n');
  process.exit(0);
}
