# API Reference

All endpoints follow RESTful conventions. Admin endpoints require authentication.

## Rate Limiting

All public API endpoints are rate-limited to prevent abuse. Rate limit headers are included in responses:

- `X-RateLimit-Limit` - Maximum requests allowed in the time window
- `X-RateLimit-Remaining` - Remaining requests in current window
- `X-RateLimit-Reset` - Time when the rate limit resets (ISO 8601)

**Rate Limits (Production):**
- Public endpoints (`/api/apps`, `/api/distros`, `/api/sources`, `/api/categories`): 30 requests/minute
- Generate endpoint (`/api/generate`): 10 requests/minute
- Search endpoint (`/api/search`): 20 requests/minute (admin only)
- Admin endpoints: 100 requests/minute

**Rate Limits (Development):**
- Public endpoints: 100 requests/minute
- Generate endpoint: 50 requests/minute
- Search endpoint: 100 requests/minute
- Admin endpoints: 200 requests/minute

When rate limit is exceeded, you'll receive a `429 Too Many Requests` response:
```json
{
  "error": "Too many requests. Please try again later.",
  "retryAfter": "2025-12-29T14:30:00.000Z"
}
```

## Public Endpoints

### GET /api/apps
Get all apps with optional filtering

**Query Parameters:**
- `category` - Filter by category slug
- `popular` - Filter popular apps (true/false)
- `search` - Search term for app name/description

**Response:**
```json
[
  {
    "id": "app_id",
    "slug": "firefox",
    "displayName": "Firefox",
    "description": "Fast, private browser",
    "iconUrl": "https://...",
    "homepage": "https://...",
    "isPopular": true,
    "isFoss": true,
    "category": { "name": "Browsers", "slug": "browsers" },
    "packages": [
      {
        "id": "pkg_id",
        "sourceId": "src_id",
        "identifier": "org.mozilla.firefox",
        "version": "120.0",
        "source": { "name": "Flatpak", "slug": "flatpak" }
      }
    ]
  }
]
```

### GET /api/apps/[id]
Get single app by ID with full details

### GET /api/apps/by-slug/[slug]
Get single app by slug with full details

### GET /api/distros
Get all distributions

**Response:**
```json
[
  {
    "id": "distro_id",
    "name": "Ubuntu",
    "slug": "ubuntu",
    "family": "debian",
    "iconUrl": "https://...",
    "isPopular": true,
    "distroSources": [
      {
        "sourceId": "src_id",
        "priority": 10,
        "isDefault": true,
        "source": { "name": "APT", "slug": "apt" }
      }
    ]
  }
]
```

### GET /api/sources
Get all package sources

### GET /api/categories
Get all categories

### POST /api/generate
Generate install command

**Request Body:**
```json
{
  "distroSlug": "ubuntu",
  "sourcePreference": "flatpak",
  "appIds": ["app_id_1", "app_id_2"]
}
```

**Response:**
```json
{
  "commands": [
    "sudo apt install -y git vim",
    "flatpak install -y flathub org.mozilla.firefox"
  ],
  "setupCommands": [
    "flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo"
  ],
  "warnings": [
    "Chrome: No package available for Ubuntu"
  ],
  "breakdown": [
    {
      "source": "APT",
      "packages": ["git", "vim"]
    },
    {
      "source": "Flatpak",
      "packages": ["org.mozilla.firefox"]
    }
  ]
}
```

## Admin Endpoints (Protected)

All admin endpoints require authentication via BetterAuth session.

### Apps
- `POST /api/apps` - Create new app
- `PUT /api/apps/[id]` - Update app
- `DELETE /api/apps/[id]` - Delete app

### Packages
- `POST /api/packages` - Create package
- `PUT /api/packages/[id]` - Update package
- `DELETE /api/packages/[id]` - Delete package

### Sources
- `POST /api/sources` - Create source
- `PUT /api/sources/[id]` - Update source
- `DELETE /api/sources/[id]` - Delete source

### Distros
- `POST /api/distros` - Create distro
- `PUT /api/distros/[id]` - Update distro
- `DELETE /api/distros/[id]` - Delete distro

### Distro Sources
- `POST /api/distro-sources` - Map source to distro
- `PUT /api/distro-sources/[id]` - Update mapping
- `DELETE /api/distro-sources/[id]` - Delete mapping

### Categories
- `POST /api/categories` - Create category
- `PUT /api/categories/[id]` - Update category
- `DELETE /api/categories/[id]` - Delete category

### External Search
- `POST /api/search` - Search external APIs (Flathub, Snap, etc.)

**Request Body:**
```json
{
  "source": "flatpak",
  "query": "firefox"
}
```

### Refresh
- `POST /api/refresh` - Trigger package metadata refresh
- `GET /api/refresh/logs` - Get refresh job logs

### Image Upload
- `POST /api/upload` - Upload image to Vercel Blob (admin only)

**Request:** Multipart form data
- `file` - Image file (PNG, JPEG, WebP, SVG, max 5MB)
- `pathname` - Optional custom pathname (e.g., "app-icons/firefox.png")

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://vercel-blob-url..."
  }
}
```

- `DELETE /api/upload` - Delete image from Vercel Blob (admin only)

**Request Body:**
```json
{
  "url": "https://vercel-blob-url..."
}
```

### Cron (Internal)
- `GET /api/cron/refresh` - Vercel cron endpoint (requires CRON_SECRET)
