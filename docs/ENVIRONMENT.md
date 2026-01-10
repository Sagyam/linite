# Environment Variables

This document describes all environment variables used in Linite and how to set them up.

## Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in the required values (see below)

3. Validate your configuration:
   ```bash
   bun run check-env
   ```

## Required Variables

### Database - Turso (libSQL)

```env
DATABASE_URL="libsql://your-db.turso.io"
DATABASE_AUTH_TOKEN="your-turso-auth-token"
```

**How to get these:**
1. Sign up at [turso.tech](https://turso.tech)
2. Create a new database
3. Get the URL and auth token from the dashboard

**Note:** `DATABASE_AUTH_TOKEN` is technically optional in the schema but required for Turso databases.

### App URL

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Default:** `http://localhost:3000`

Change this to your production domain when deploying.

### BetterAuth

```env
BETTER_AUTH_SECRET="your-secret-here-min-32-chars-change-this-to-random-string"
BETTER_AUTH_URL="http://localhost:3000"
```

**Requirements:**
- `BETTER_AUTH_SECRET` must be at least 32 characters long
- Use a random string in production
- `BETTER_AUTH_URL` should match your app URL (default: `http://localhost:3000`)

**Generate a secure secret:**
```bash
openssl rand -base64 32
```

### GitHub OAuth

```env
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

**How to get these:**
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth application
3. Set Authorization callback URL to: `{BETTER_AUTH_URL}/api/auth/callback/github`
4. Copy the Client ID and generate a new Client Secret

**Required for:** Admin and user login via GitHub

### Google OAuth (Optional)

```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

**How to get these:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID
3. Set Authorized redirect URI to: `{BETTER_AUTH_URL}/api/auth/callback/google`
4. Copy the Client ID and Client Secret

**Optional:** For user login via Google. Not required for the app to function.

### Azure Blob Storage

```env
AZURE_STORAGE_SAS_URL="https://{account}.blob.core.windows.net/{container}?{sas-token}"
```

**How to get this:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Storage Account
3. Create a container (e.g., "linite-icons")
4. Generate a SAS token with the following permissions: `sp=racwdli` (read, add, create, write, delete, list, immutable)
5. Construct the full SAS URL including the container name and SAS token

**Example format:**
```
https://linite.blob.core.windows.net/linite-icons?sp=racwdli&st=2026-01-04T06:11:50Z&se=2027-01-04T14:26:50Z&spr=https&sv=2024-11-04&sr=c&sig=...
```

**Required for:** App icon uploads in the admin dashboard

### Superadmin Email

```env
SUPERADMIN_EMAIL="sagyamthapa32@gmail.com"
```

**Default:** `sagyamthapa32@gmail.com`

The email address of the superadmin user who has access to the admin dashboard. This user can create, edit, and delete apps, distros, and sources.

## Optional Variables

### Cron Secret

```env
CRON_SECRET="your-cron-secret-change-this"
```

Used to secure the cron endpoint (`/api/refresh`) that refreshes package data from external sources. Should be at least 16 characters.

**Recommended for:** Production deployments to prevent unauthorized package refreshes

## Environment Validation

The application uses Zod to validate all environment variables on startup. If any required variable is missing or invalid, you'll see a detailed error message.

### Running the validator manually

```bash
bun run check-env
```

**Example output (success):**
```
✅ All environment variables are valid!

📋 Configuration summary:
   Database: libsql://linite-sagyam.aws-ap-...
   Auth URL: http://localhost:3000
   Blob Storage: ✅ Configured

🚀 You're ready to go!
```

**Example output (error):**
```
❌ Environment validation failed!

  BETTER_AUTH_SECRET:
    ❌ BETTER_AUTH_SECRET must be at least 32 characters long

  DATABASE_URL:
    ❌ DATABASE_URL must start with libsql://, https://, or http:// (Turso URL)

💡 Tips:
   1. Make sure you have a .env file in the project root
   2. Copy .env.example to .env if you haven't already
   3. Fill in all required values
   4. Make sure there are no typos in variable names
```

## Validation Rules

Both validation scripts (`src/lib/env.ts` for runtime and `scripts/check-env.ts` for manual checks) use the same schema, which enforces these rules:

| Variable | Type | Validation |
|----------|------|------------|
| `DATABASE_URL` | Required | Must start with `libsql://`, `https://`, or `http://` |
| `DATABASE_AUTH_TOKEN` | Optional | String (required for Turso) |
| `NEXT_PUBLIC_APP_URL` | Required | Valid URL (default: `http://localhost:3000`) |
| `BETTER_AUTH_SECRET` | Required | Min 32 characters |
| `BETTER_AUTH_URL` | Required | Valid URL (default: `http://localhost:3000`) |
| `SUPERADMIN_EMAIL` | Optional | Valid email address (default: `sagyamthapa32@gmail.com`) |
| `GITHUB_CLIENT_ID` | Required | Non-empty string |
| `GITHUB_CLIENT_SECRET` | Required | Non-empty string |
| `GOOGLE_CLIENT_ID` | Optional | Non-empty string |
| `GOOGLE_CLIENT_SECRET` | Optional | Non-empty string |
| `AZURE_STORAGE_SAS_URL` | Required | Valid URL with SAS token |
| `CRON_SECRET` | Optional | Min 16 characters if provided |
| `NODE_ENV` | Optional | One of: `development`, `production`, `test` (default: `development`) |

## Using Environment Variables in Code

Always import validated environment variables from `src/lib/env.ts`:

```typescript
import { env } from '@/lib/env';

// ✅ Good - Type-safe and validated
const dbUrl = env.DATABASE_URL;

// ❌ Bad - No validation, no type safety
const dbUrl = process.env.DATABASE_URL;
```

## Troubleshooting

### "Invalid environment variables" error on startup

1. Run `bun run check-env` to see exactly what's wrong
2. Check that your `.env` file exists
3. Verify all required variables are set
4. Make sure there are no typos in variable names

### Database connection errors

1. Verify your `DATABASE_URL` starts with `libsql://`
2. Check that your Turso database is active
3. Make sure `DATABASE_AUTH_TOKEN` is correct
4. Test connection: `bun run db:push`

## Production Deployment

When deploying to production (Vercel):

1. Set all required environment variables in Vercel dashboard:
   - `DATABASE_URL` and `DATABASE_AUTH_TOKEN`
   - `BETTER_AUTH_SECRET` (generate a new one, don't reuse dev secret)
   - `BETTER_AUTH_URL` (set to your production domain)
   - `NEXT_PUBLIC_APP_URL` (set to your production domain)
   - `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
   - `AZURE_STORAGE_SAS_URL`
   - `SUPERADMIN_EMAIL` (email of the admin user)

2. Set recommended optional variables:
   - `CRON_SECRET` (secure the refresh endpoint)
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (if enabling Google OAuth)

3. Set `NODE_ENV=production`

The validator (`src/lib/env.ts`) will run on build and fail the deployment if any required variables are missing or invalid.

## Notes

- **Validation architecture:** Environment validation uses a shared schema defined in `src/lib/env.ts`:
  - `src/lib/env.ts` - Exports the `envSchema` and validates at runtime
  - `scripts/check-env.ts` - Imports `envSchema` from `src/lib/env.ts` for manual validation
  - This ensures consistency between manual checks and runtime validation
- **Single source of truth:** Both scripts use the exact same Zod schema, preventing validation discrepancies
- **OAuth & Superadmin:** While these variables are validated by the schema, they're accessed directly from `process.env` in the BetterAuth configuration (`src/lib/auth.ts`)
