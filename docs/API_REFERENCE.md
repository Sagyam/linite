# API Reference

All endpoints follow RESTful conventions. Admin endpoints require authentication.

## API Architecture

**Recent Improvements (2026-01):**
- Centralized type system in `/src/types/` for type safety across client and server
- Zod validation schemas in `/src/lib/validation/` for request/response validation
- Standardized middleware composition in `/src/lib/api-middleware.ts`
- Database-level filtering (no more in-memory filtering)
- Pagination support (limit/offset)

**API Handler Pattern:**
All API routes now use standardized middleware patterns:
- `createPublicApiHandler` - Public endpoints
- `createAuthApiHandler` - Authenticated endpoints
- `createAuthValidatedApiHandler` - Authenticated with request body validation

This ensures consistent:
- Error handling
- Request validation
- Authentication checks

## Public Endpoints

### GET /api/apps
Get all apps with optional filtering

**Query Parameters:**
- `category` - Filter by category slug or ID
- `popular` - Filter popular apps (true/false)
- `search` - Search term for app name/description (searches both name and description)
- `limit` - Number of results to return (1-100, default: 50)
- `offset` - Number of results to skip (default: 0)

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

**Response:**
Same as GET /api/apps/[id]

### GET /api/apps/batch
Get multiple apps by IDs in a single request

**Query Parameters:**
- `ids` (required) - Comma-separated list of app IDs (max 100)

**Response:**
```json
[
  {
    "id": "app_id_1",
    "slug": "firefox",
    "displayName": "Firefox",
    "category": { "name": "Browsers", "slug": "browsers" },
    "packages": [...]
  },
  {
    "id": "app_id_2",
    "slug": "vscode",
    "displayName": "Visual Studio Code",
    "category": { "name": "Development", "slug": "development" },
    "packages": [...]
  }
]
```

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

### GET /api/collections
List public and featured collections

**Query Parameters:**
- `featured` - Filter featured collections (true/false)
- `search` - Search collection name/description
- `tags` - Comma-separated list of tags to filter by
- `limit` - Number of results (1-100, default: 20)
- `offset` - Number of results to skip (default: 0)

**Response:**
```json
{
  "collections": [
    {
      "id": "collection_id",
      "userId": "user_id",
      "name": "Essential Developer Tools",
      "description": "Must-have tools for developers",
      "slug": "essential-dev-tools",
      "iconUrl": "https://...",
      "isPublic": true,
      "isFeatured": true,
      "isTemplate": false,
      "viewCount": 1250,
      "installCount": 430,
      "tags": ["development", "productivity"],
      "user": {
        "id": "user_id",
        "name": "John Doe",
        "image": "https://..."
      },
      "items": [
        {
          "id": "item_id",
          "appId": "app_id",
          "displayOrder": 0,
          "note": "Best code editor",
          "app": {
            "id": "app_id",
            "slug": "vscode",
            "displayName": "Visual Studio Code",
            "iconUrl": "https://..."
          }
        }
      ],
      "_count": {
        "items": 12,
        "likes": 89
      },
      "isLiked": false,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-05T00:00:00.000Z"
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

### GET /api/collections/[id]
Get single public collection by ID (increments view count)

**Response:**
```json
{
  "id": "collection_id",
  "name": "Essential Developer Tools",
  "slug": "essential-dev-tools",
  "description": "Must-have tools for developers",
  "iconUrl": "https://...",
  "isPublic": true,
  "user": {...},
  "items": [...],
  "_count": {...},
  "createdAt": "...",
  "updatedAt": "..."
}
```

### GET /api/collections/by-slug/[slug]
Get single collection by slug (public or owner's private, increments view count)

**Response:**
Same as GET /api/collections/[id]

### GET /api/collections/share/[token]
Get collection via share token (works for private collections)

**Response:**
Same as GET /api/collections/[id]

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
- `POST /api/upload` - Upload image to Azure Blob Storage (admin only)

**Request:** Multipart form data
- `file` - Image file (PNG, JPEG, WebP, SVG, max 5MB)
- `pathname` - Optional custom pathname (e.g., "app-icons/firefox.png")

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://linite.blob.core.windows.net/linite-icons/app-icons/firefox.png"
  }
}
```

- `DELETE /api/upload` - Delete image from Azure Blob Storage (admin only)

**Request Body:**
```json
{
  "url": "https://linite.blob.core.windows.net/linite-icons/app-icons/firefox.png"
}
```

### Cron (Internal)
- `GET /api/cron/refresh` - Vercel cron endpoint (requires CRON_SECRET)

## User Collection Endpoints (Authenticated)

These endpoints require user authentication and allow users to manage their own collections.

### GET /api/user/collections
List current user's collections

**Query Parameters:**
- `limit` - Number of results (default: 20)
- `offset` - Number of results to skip (default: 0)
- `search` - Search collection name/description

**Response:**
```json
{
  "collections": [
    {
      "id": "collection_id",
      "userId": "user_id",
      "name": "My Dev Setup",
      "description": "My personal development environment",
      "slug": "my-dev-setup",
      "iconUrl": "https://...",
      "isPublic": false,
      "isFeatured": false,
      "isTemplate": false,
      "shareToken": "abc123",
      "viewCount": 5,
      "installCount": 2,
      "tags": ["development"],
      "items": [],
      "_count": {
        "items": 8,
        "likes": 0
      },
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-05T00:00:00.000Z"
    }
  ],
  "total": 3,
  "limit": 20,
  "offset": 0
}
```

### POST /api/user/collections
Create a new collection

**Request Body:**
```json
{
  "name": "My Dev Setup",
  "description": "My personal development environment",
  "iconUrl": "https://...",
  "isPublic": false,
  "tags": ["development", "personal"]
}
```

**Response:** (201 Created)
```json
{
  "id": "collection_id",
  "userId": "user_id",
  "name": "My Dev Setup",
  "slug": "my-dev-setup",
  "description": "My personal development environment",
  "iconUrl": "https://...",
  "isPublic": false,
  "isFeatured": false,
  "isTemplate": false,
  "shareToken": null,
  "viewCount": 0,
  "installCount": 0,
  "tags": ["development", "personal"],
  "items": [],
  "_count": {
    "items": 0,
    "likes": 0
  },
  "createdAt": "2025-01-05T00:00:00.000Z",
  "updatedAt": "2025-01-05T00:00:00.000Z"
}
```

### GET /api/user/collections/[id]
Get single collection owned by user

**Response:**
Same as POST /api/user/collections

### PUT /api/user/collections/[id]
Update collection (requires ownership)

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "iconUrl": "https://...",
  "isPublic": true,
  "tags": ["development", "productivity"]
}
```

**Response:**
Updated collection object

### DELETE /api/user/collections/[id]
Delete collection (requires ownership)

**Response:**
```json
{
  "message": "Collection deleted successfully"
}
```

### POST /api/user/collections/[id]/items
Add an app to the collection (requires ownership)

**Request Body:**
```json
{
  "appId": "app_id",
  "note": "Great code editor"
}
```

**Response:** (201 Created)
Updated collection object with new item

### DELETE /api/user/collections/[id]/items/[itemId]
Remove an app from the collection (requires ownership)

**Response:**
Updated collection object

### POST /api/user/collections/[id]/share
Generate or regenerate share token for collection (requires ownership)

**Response:**
```json
{
  "shareToken": "abc123xyz",
  "shareUrl": "https://linite.dev/collections/share/abc123xyz"
}
```

### POST /api/user/collections/[id]/like
Toggle like on a collection (like/unlike)

**Response:**
```json
{
  "liked": true,
  "likeCount": 90
}
```

### POST /api/user/collections/[id]/clone
Clone a public collection to current user's account

**Response:** (201 Created)
```json
{
  "id": "new_collection_id",
  "userId": "current_user_id",
  "name": "Essential Developer Tools (Copy)",
  "description": "Must-have tools for developers",
  "slug": "essential-dev-tools-copy",
  "isPublic": false,
  "items": [],
  "createdAt": "2025-01-05T00:00:00.000Z",
  "updatedAt": "2025-01-05T00:00:00.000Z"
}
```

**Notes:**
- Cannot clone your own collections
- Cloned collections are private by default
- Collection name gets " (Copy)" appended
- All items are copied with their notes

## Complete Endpoint Summary

### Public Endpoints (No Auth Required)

**Apps:**
- `GET /api/apps` - List all apps (filterable, paginated)
- `GET /api/apps/[id]` - Get app by ID
- `GET /api/apps/by-slug/[slug]` - Get app by slug
- `GET /api/apps/batch` - Get multiple apps by IDs

**Categories:**
- `GET /api/categories` - List all categories

**Distros:**
- `GET /api/distros` - List all distributions
- `GET /api/distros/[id]` - Get distro by ID

**Sources:**
- `GET /api/sources` - List all package sources
- `GET /api/sources/[id]` - Get source by ID

**Collections:**
- `GET /api/collections` - List public/featured collections
- `GET /api/collections/[id]` - Get collection by ID
- `GET /api/collections/by-slug/[slug]` - Get collection by slug
- `GET /api/collections/share/[token]` - Get collection by share token

**Command Generation:**
- `POST /api/generate` - Generate install command

### Admin Endpoints (Auth Required, Admin Role)

**Apps:**
- `POST /api/apps` - Create app
- `PUT /api/apps/[id]` - Update app
- `DELETE /api/apps/[id]` - Delete app

**Categories:**
- `POST /api/categories` - Create category
- `PUT /api/categories/[id]` - Update category
- `DELETE /api/categories/[id]` - Delete category

**Distros:**
- `POST /api/distros` - Create distro
- `PUT /api/distros/[id]` - Update distro
- `DELETE /api/distros/[id]` - Delete distro

**Sources:**
- `POST /api/sources` - Create source
- `PUT /api/sources/[id]` - Update source
- `DELETE /api/sources/[id]` - Delete source

**Packages:**
- `POST /api/packages` - Create package
- `PUT /api/packages/[id]` - Update package
- `DELETE /api/packages/[id]` - Delete package

**Distro Sources:**
- `POST /api/distro-sources` - Create distro-source mapping
- `PUT /api/distro-sources/[id]` - Update mapping
- `DELETE /api/distro-sources/[id]` - Delete mapping

**External APIs:**
- `POST /api/search` - Search external package sources

**Refresh:**
- `POST /api/refresh` - Trigger package metadata refresh
- `GET /api/refresh/logs` - Get refresh logs

**Upload:**
- `POST /api/upload` - Upload image to Azure Blob Storage
- `DELETE /api/upload` - Delete image from Azure Blob Storage

### User Endpoints (Auth Required, User Role)

**Collections Management:**
- `GET /api/user/collections` - List user's collections
- `POST /api/user/collections` - Create collection
- `GET /api/user/collections/[id]` - Get user's collection
- `PUT /api/user/collections/[id]` - Update collection
- `DELETE /api/user/collections/[id]` - Delete collection

**Collection Items:**
- `POST /api/user/collections/[id]/items` - Add app to collection
- `DELETE /api/user/collections/[id]/items/[itemId]` - Remove app from collection

**Collection Actions:**
- `POST /api/user/collections/[id]/share` - Generate share token
- `POST /api/user/collections/[id]/like` - Toggle like
- `POST /api/user/collections/[id]/clone` - Clone collection

### Internal Endpoints

**Cron:**
- `GET /api/cron/refresh` - Scheduled refresh job (requires CRON_SECRET)

**Auth:**
- `ALL /api/auth/[...all]` - BetterAuth authentication endpoints
