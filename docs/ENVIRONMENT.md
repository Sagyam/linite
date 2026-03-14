# Environment Variables

Copy `.env.example` to `.env` and fill in the values. Validate with `bun run check-env`.

## Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Turso URL (`libsql://...`) |
| `DATABASE_AUTH_TOKEN` | Turso auth token |
| `BETTER_AUTH_SECRET` | Min 32 chars. Generate: `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | App URL (default: `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | App URL (default: `http://localhost:3000`) |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app secret |
| `AZURE_STORAGE_SAS_URL` | Azure Blob Storage SAS URL for icon uploads |

## Optional

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret |
| `SUPERADMIN_EMAIL` | Admin user email |
| `CRON_SECRET` | Secret for `/api/refresh` endpoint (min 16 chars) |

## Getting Credentials

**Turso**: Sign up at [turso.tech](https://turso.tech), create a database, get URL and token.

**GitHub OAuth**: Settings > Developer settings > OAuth Apps. Callback URL: `{APP_URL}/api/auth/callback/github`

**Azure Blob**: Create storage account and container. Generate SAS token with read/write/delete permissions.