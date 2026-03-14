# API Reference

All routes use standardized middleware from `/src/lib/api-middleware.ts`.

## Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/apps` | List apps (query: `category`, `popular`, `search`, `limit`, `offset`) |
| GET | `/api/apps/[id]` | Get app by ID |
| GET | `/api/apps/by-slug/[slug]` | Get app by slug |
| GET | `/api/apps/batch?ids=a,b,c` | Get multiple apps |
| GET | `/api/categories` | List categories |
| GET | `/api/distros` | List distributions |
| GET | `/api/sources` | List package sources |
| GET | `/api/collections` | List public collections |
| GET | `/api/collections/[id]` | Get collection |
| GET | `/api/collections/share/[token]` | Get collection by share token |
| POST | `/api/generate` | Generate install command |
| POST | `/api/uninstall` | Generate uninstall command |

## User Endpoints (Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/collections` | List user's collections |
| POST | `/api/user/collections` | Create collection |
| PUT | `/api/user/collections/[id]` | Update collection |
| DELETE | `/api/user/collections/[id]` | Delete collection |
| POST | `/api/user/collections/[id]/items` | Add app to collection |
| DELETE | `/api/user/collections/[id]/items/[itemId]` | Remove app |
| POST | `/api/user/collections/[id]/share` | Generate share token |
| GET | `/api/installations` | List installations |
| POST | `/api/installations` | Create installation |
| DELETE | `/api/installations/[id]` | Delete installation |
| POST | `/api/installations/bulk-delete` | Bulk delete |
| GET | `/api/installations/devices` | List user's devices |

## Admin Endpoints (Admin Role Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST/PUT/DELETE | `/api/apps/[id]` | Manage apps |
| POST/PUT/DELETE | `/api/categories/[id]` | Manage categories |
| POST/PUT/DELETE | `/api/distros/[id]` | Manage distros |
| POST/PUT/DELETE | `/api/sources/[id]` | Manage sources |
| POST/PUT/DELETE | `/api/packages/[id]` | Manage packages |
| POST/PUT/DELETE | `/api/distro-sources/[id]` | Manage distro-source mappings |
| POST | `/api/search` | Search external APIs |
| POST | `/api/refresh` | Trigger metadata refresh |
| POST/DELETE | `/api/upload` | Manage images in Azure Blob |

## Key Request/Response Examples

### POST /api/generate

```json
// Request
{ "distroSlug": "ubuntu", "sourcePreference": "flatpak", "appIds": ["id1", "id2"] }

// Response
{
  "commands": ["flatpak install -y flathub org.mozilla.firefox"],
  "setupCommands": ["flatpak remote-add --if-not-exists flathub ..."],
  "warnings": ["Chrome: No package available"],
  "breakdown": [{ "source": "Flatpak", "packages": ["org.mozilla.firefox"] }]
}
```

### POST /api/uninstall

```json
// Request
{ "distroSlug": "ubuntu", "sourcePreference": "flatpak", "appIds": ["id1"] }

// Response
{
  "commands": ["flatpak uninstall -y org.mozilla.firefox"],
  "cleanupCommands": [],
  "dependencyCleanupCommands": ["sudo apt autoremove -y"],
  "warnings": [],
  "manualSteps": []
}
```