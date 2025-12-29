import { z } from 'zod';

/**
 * Environment variable schema with detailed validation
 */
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

  // Vercel Blob - Required for image uploads
  BLOB_READ_WRITE_TOKEN: z
    .string()
    .min(1, 'BLOB_READ_WRITE_TOKEN is required for image uploads'),

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

/**
 * Validate and parse environment variables
 * This will throw a detailed error if validation fails
 */
function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error('');

    const errors = parsed.error.format();

    // Display each error in a readable format
    Object.entries(errors).forEach(([key, value]) => {
      if (key !== '_errors' && value && typeof value === 'object' && '_errors' in value) {
        const fieldErrors = value._errors as string[];
        if (fieldErrors.length > 0) {
          console.error(`  ${key}:`);
          fieldErrors.forEach((error) => {
            console.error(`    - ${error}`);
          });
        }
      }
    });

    console.error('');
    console.error('💡 Please check your .env file and ensure all required variables are set.');
    console.error('   See .env.example for reference.');
    console.error('');

    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

/**
 * Validated environment variables
 * Use this instead of process.env to get type-safe, validated env vars
 */
export const env = validateEnv();

/**
 * Type for the validated environment
 */
export type Env = z.infer<typeof envSchema>;
