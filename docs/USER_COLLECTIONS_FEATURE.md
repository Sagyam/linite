# User Collections Feature - Design Specification

## Overview

This feature enables regular users to create, manage, and share collections of applications, transforming Linite from an admin-only tool into a community-driven platform.

## Current State Analysis

### Existing Auth System
- **BetterAuth v1.4.9** configured with GitHub OAuth
- **Roles**: `admin` and `superadmin` only
- **Access**: Only authenticated admins can access the dashboard
- **User Flow**: GitHub login → Admin dashboard

### Proposed Changes
- Add **Google OAuth** provider
- Introduce `user` role (default for new signups)
- Separate user dashboard from admin panel
- Keep admin panel restricted to admin/superadmin roles

---

## Database Schema Design

### New Tables

#### 1. `collections`
User-created app bundles with metadata and sharing settings.

```sql
CREATE TABLE collections (
  id TEXT PRIMARY KEY,               -- CUID2
  userId TEXT NOT NULL,              -- FK to user.id
  name TEXT NOT NULL,                -- Collection name (e.g., "Web Dev Setup")
  description TEXT,                  -- Optional description
  slug TEXT NOT NULL UNIQUE,         -- URL-friendly slug
  iconUrl TEXT,                      -- Optional collection icon
  isPublic BOOLEAN DEFAULT false,    -- Public visibility
  isFeatured BOOLEAN DEFAULT false,  -- Featured by admins
  isTemplate BOOLEAN DEFAULT false,  -- Template collection (by admins)
  shareToken TEXT UNIQUE,            -- Random token for sharing
  viewCount INTEGER DEFAULT 0,       -- Analytics: view count
  installCount INTEGER DEFAULT 0,    -- Analytics: install count
  tags TEXT,                         -- JSON array of tags
  createdAt TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP NOT NULL,

  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX collections_user_id_idx ON collections(userId);
CREATE INDEX collections_slug_idx ON collections(slug);
CREATE INDEX collections_public_idx ON collections(isPublic);
CREATE INDEX collections_featured_idx ON collections(isFeatured);
CREATE INDEX collections_share_token_idx ON collections(shareToken);
```

#### 2. `collectionItems`
Apps within a collection with optional customization.

```sql
CREATE TABLE collection_items (
  id TEXT PRIMARY KEY,               -- CUID2
  collectionId TEXT NOT NULL,        -- FK to collections.id
  appId TEXT NOT NULL,               -- FK to apps.id
  displayOrder INTEGER DEFAULT 0,    -- Sort order within collection
  note TEXT,                         -- Optional user note for this app
  createdAt TIMESTAMP NOT NULL,

  FOREIGN KEY (collectionId) REFERENCES collections(id) ON DELETE CASCADE,
  FOREIGN KEY (appId) REFERENCES apps(id) ON DELETE CASCADE,
  UNIQUE(collectionId, appId)        -- Prevent duplicate apps in collection
);

CREATE INDEX collection_items_collection_id_idx ON collection_items(collectionId);
CREATE INDEX collection_items_app_id_idx ON collection_items(appId);
```

#### 3. `collectionLikes` (Optional Enhancement)
Track user likes/favorites for discovery.

```sql
CREATE TABLE collection_likes (
  id TEXT PRIMARY KEY,               -- CUID2
  userId TEXT NOT NULL,              -- FK to user.id
  collectionId TEXT NOT NULL,        -- FK to collections.id
  createdAt TIMESTAMP NOT NULL,

  FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (collectionId) REFERENCES collections(id) ON DELETE CASCADE,
  UNIQUE(userId, collectionId)
);

CREATE INDEX collection_likes_user_id_idx ON collection_likes(userId);
CREATE INDEX collection_likes_collection_id_idx ON collection_likes(collectionId);
```

---

## Auth Configuration Changes

### Update `src/db/schema.ts`

```typescript
// Modify user table role enum to include 'user'
export const user = sqliteTable('user', {
  // ... existing fields
  role: text('role', { enum: ['user', 'admin', 'superadmin'] }).default('user'),
  // ... timestamps
});
```

### Update `src/lib/auth.ts`

```typescript
export const auth = betterAuth({
  // ... existing config
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  user: {
    modelName: 'user',
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'user', // Changed from 'admin' to 'user'
        input: false,
      },
    },
  },
  async onSignUp({ user }: { user: { id: string; email: string } }) {
    // Assign roles based on email
    const ADMIN_EMAILS = ['sagyamthapa32@gmail.com'];

    if (ADMIN_EMAILS.includes(user.email)) {
      await db.update(schema.user).set({ role: 'superadmin' }).where(eq(schema.user.id, user.id));
    }
    // Regular users already have 'user' role by default
  },
});
```

### Environment Variables (`.env`)

Add Google OAuth credentials (user will add these):

```bash
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

---

## API Routes

### Public Endpoints

#### `GET /api/collections`
List public/featured collections with filtering.

**Query Parameters:**
- `featured` - Show featured collections only (true/false)
- `userId` - Filter by user ID
- `search` - Search term (name/description)
- `tags` - Filter by tags (comma-separated)
- `limit` - Results per page (default: 20, max: 100)
- `offset` - Pagination offset

**Response:**
```json
{
  "collections": [
    {
      "id": "coll_123",
      "name": "Web Developer Essentials",
      "description": "Everything you need for web development",
      "slug": "web-dev-essentials",
      "iconUrl": "https://...",
      "isPublic": true,
      "isFeatured": true,
      "viewCount": 1250,
      "installCount": 340,
      "tags": ["development", "web"],
      "user": {
        "id": "user_123",
        "name": "John Doe",
        "image": "https://..."
      },
      "items": [
        {
          "id": "item_1",
          "app": { /* app details */ },
          "note": "Essential for frontend work"
        }
      ],
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-02T00:00:00Z"
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

#### `GET /api/collections/[id]`
Get single collection by ID (public or owned by user).

#### `GET /api/collections/by-slug/[slug]`
Get collection by slug (public or owned by user).

#### `GET /api/collections/share/[shareToken]`
Get collection via share link (works for private collections).

### Authenticated User Endpoints

#### `GET /api/user/collections`
List current user's collections (all visibility levels).

#### `POST /api/user/collections`
Create new collection.

**Request Body:**
```json
{
  "name": "My Dev Tools",
  "description": "Tools I use daily",
  "isPublic": false,
  "tags": ["development", "productivity"],
  "appIds": ["app_1", "app_2", "app_3"]
}
```

#### `PUT /api/user/collections/[id]`
Update collection metadata.

#### `DELETE /api/user/collections/[id]`
Delete collection.

#### `POST /api/user/collections/[id]/items`
Add app to collection.

**Request Body:**
```json
{
  "appId": "app_123",
  "note": "Great for debugging"
}
```

#### `DELETE /api/user/collections/[id]/items/[itemId]`
Remove app from collection.

#### `PUT /api/user/collections/[id]/items/reorder`
Reorder apps in collection.

**Request Body:**
```json
{
  "itemOrders": [
    { "itemId": "item_1", "displayOrder": 0 },
    { "itemId": "item_2", "displayOrder": 1 }
  ]
}
```

#### `POST /api/user/collections/[id]/share`
Generate/regenerate share token.

**Response:**
```json
{
  "shareToken": "random-token-abc123",
  "shareUrl": "https://linite.dev/collections/share/random-token-abc123"
}
```

#### `POST /api/user/collections/[id]/clone`
Clone a public collection or shared collection.

#### `POST /api/user/collections/[id]/like`
Like/unlike a collection (toggle).

### Admin Endpoints

#### `PUT /api/admin/collections/[id]/feature`
Feature/unfeature a collection.

#### `POST /api/admin/collections/[id]/template`
Convert collection to template.

---

## Validation Schemas

### `src/lib/validation/schemas/collection.schema.ts`

```typescript
import { z } from 'zod';
import { slugSchema } from './common.schema';

export const createCollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).max(10).optional(),
  appIds: z.array(z.string()).min(1).max(100),
});

export const updateCollectionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  iconUrl: z.string().url().optional(),
  tags: z.array(z.string()).max(10).optional(),
});

export const addCollectionItemSchema = z.object({
  appId: z.string(),
  note: z.string().max(200).optional(),
});

export const reorderCollectionItemsSchema = z.object({
  itemOrders: z.array(
    z.object({
      itemId: z.string(),
      displayOrder: z.number().int().min(0),
    })
  ).min(1),
});

export const collectionQuerySchema = z.object({
  featured: z.enum(['true', 'false']).optional(),
  userId: z.string().optional(),
  search: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
```

---

## UI/UX Design

### Page Structure

```
/
├── app/
│   ├── (public)/
│   │   ├── page.tsx              # Homepage (existing)
│   │   ├── apps/                 # App browsing (existing)
│   │   ├── collections/          # Browse public collections (NEW)
│   │   │   ├── page.tsx          # Collection gallery
│   │   │   ├── [slug]/           # Collection details
│   │   │   └── share/[token]/    # Shared collection view
│   │   └── login/                # User login page (NEW)
│   │
│   ├── dashboard/                # User dashboard (NEW)
│   │   ├── layout.tsx            # User dashboard layout
│   │   ├── page.tsx              # Dashboard home
│   │   ├── collections/          # Manage collections
│   │   │   ├── page.tsx          # List user's collections
│   │   │   ├── new/              # Create collection
│   │   │   └── [id]/edit/        # Edit collection
│   │   └── liked/                # Liked collections
│   │
│   └── admin/                    # Admin panel (existing - restricted)
```

### Key Components

#### `src/components/collection/`

1. **`collection-card.tsx`**
   - Display collection preview with app count, creator, likes
   - "Quick Install" button to generate command
   - Public/Private badge

2. **`collection-detail.tsx`**
   - Full collection view with app list
   - Install button (uses existing `/api/generate`)
   - Share button (if owner)
   - Clone button (if not owner)

3. **`collection-form.tsx`**
   - Create/edit collection
   - App selector with search
   - Drag-and-drop reordering
   - Privacy toggle

4. **`collection-app-selector.tsx`**
   - Search and filter apps
   - Add/remove apps to collection
   - Show app source compatibility

#### `src/components/dashboard/`

1. **`user-nav.tsx`**
   - User menu with profile, collections, logout
   - Different from admin sidebar

2. **`user-sidebar.tsx`**
   - Navigation for user dashboard
   - My Collections, Liked, Discover

### User Flow

#### 1. **New User Registration**
1. Visit homepage → Click "Login" or "Create Collection"
2. Choose GitHub or Google OAuth
3. Redirected to `/dashboard` after auth
4. See onboarding: "Create your first collection!"

#### 2. **Creating a Collection**
1. Dashboard → "New Collection"
2. Enter name, description, privacy
3. Search and add apps
4. Save → Generate install command
5. Optionally share via link

#### 3. **Discovering Collections**
1. Visit `/collections` (public browse)
2. Filter by tags, featured, popular
3. View collection details
4. Clone to own account or install directly

#### 4. **Sharing**
- **Public**: Anyone can find via URL or search
- **Private**: Only accessible via share token
- **Share Link**: `https://linite.dev/collections/share/abc123`

---

## Advanced Features (Enhancements)

### 1. Collection Templates
- Admins can create curated "starter packs"
- Users can clone and customize
- E.g., "Linux Beginner Setup", "Arch Power User"

### 2. Social Features
- Like/favorite collections
- Comment system (future)
- Follow users (future)

### 3. Analytics
- Track view count, install count
- Show trending collections
- Creator insights dashboard

### 4. Export Options
- Export as shell script (enhanced `/api/generate`)
- Export as markdown
- Export to GitHub Gist

### 5. Collaborative Collections
- Multiple owners/editors
- Permission levels (future)

### 6. Collection Versioning
- Track changes over time
- Restore previous versions (future)

---

## Security Considerations

### 1. Authorization Middleware

```typescript
// src/lib/api-utils.ts additions

export async function requireUser(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: errorResponse('Unauthorized', 401) };
  }

  return { user: session.user };
}

export async function requireCollectionOwnership(
  collectionId: string,
  userId: string
) {
  const collection = await db.query.collections.findFirst({
    where: eq(schema.collections.id, collectionId),
  });

  if (!collection) {
    throw new Error('Collection not found');
  }

  if (collection.userId !== userId) {
    throw new Error('Unauthorized: Not collection owner');
  }

  return collection;
}
```

### 2. Rate Limiting
- Collection creation: 10 per hour per user
- Share token generation: 20 per hour
- Public browse: 30 per minute

### 3. Data Validation
- Sanitize user input (names, descriptions)
- Limit collection size (max 100 apps)
- Validate app IDs exist before adding

---

## Migration Strategy

### Step 1: Database Migration
```bash
bun run db:generate   # Generate migration for new tables
bun run db:migrate    # Apply migration
```

### Step 2: Auth Migration
- Update user role enum to include 'user'
- Existing admin users keep their roles
- New signups default to 'user' role

### Step 3: Gradual Rollout
1. Deploy backend (API routes, schema)
2. Deploy user dashboard (authenticated)
3. Deploy public collection browsing
4. Announce feature to users

---

## Testing Checklist

### Unit Tests
- [ ] Collection CRUD operations
- [ ] Collection item management
- [ ] Share token generation
- [ ] Authorization checks

### Integration Tests
- [ ] User signup → create collection → share
- [ ] Public collection browsing
- [ ] Admin featuring collections
- [ ] OAuth flow (GitHub + Google)

### E2E Tests
- [ ] Complete user journey
- [ ] Collection installation command generation
- [ ] Privacy settings enforcement

---

## Open Questions & Suggestions

### 1. **Collection Limits**
Should we limit:
- Number of collections per user? (e.g., 50 for free users)
- Collection size? (suggested: 100 apps max)
- Private collections? (unlimited or 10 private, unlimited public?)

**Recommendation**: Start unlimited, add quotas if abuse occurs.

### 2. **Sharing Permissions**
Currently proposing:
- Public: Anyone with URL
- Private: Only with share token

Should we add:
- "Unlisted" (public but not in search results)?
- Password-protected sharing?

**Recommendation**: Start simple (public/private), add unlisted later.

### 3. **Collection Discovery**
How should users discover collections?
- Featured section on homepage?
- Dedicated `/collections` page?
- Integrate into app browsing?

**Recommendation**: Both - featured on homepage + dedicated browse page.

### 4. **Monetization Potential** (Future)
If you ever want to monetize:
- Premium users: Unlimited private collections, analytics, custom icons
- Free users: Limited private collections

**Recommendation**: Launch free, monitor usage before monetizing.

### 5. **Admin Moderation**
Should admins be able to:
- Hide/delete inappropriate collections?
- Require approval for featured collections?

**Recommendation**: Yes - add admin moderation tools.

---

## Implementation Timeline Estimate

### Phase 1: Core Infrastructure (Week 1)
- Database schema & migrations
- Auth updates (Google OAuth, user role)
- Basic API routes (CRUD)

### Phase 2: User Dashboard (Week 1-2)
- User dashboard layout
- Collection management UI
- App selector component

### Phase 3: Public Features (Week 2)
- Collection browsing page
- Collection detail view
- Install command integration

### Phase 4: Sharing & Discovery (Week 2-3)
- Share token system
- Public/private logic
- Collection gallery

### Phase 5: Enhancements (Week 3+)
- Likes/favorites
- Featured collections
- Analytics
- Templates

---

## Conclusion

This design provides a robust foundation for user collections while maintaining the existing admin-only app management workflow. The key decisions are:

1. **Separate user and admin dashboards** - keeps admin tools clean
2. **Simple sharing model** - public/private with share tokens
3. **Reuse existing command generation** - collections just group apps
4. **Extensible schema** - easy to add likes, comments, collaboration later

The feature transforms Linite from a one-time-use tool into a platform where users can save, organize, and share their perfect Linux setups.

**Next Steps:**
1. Review this proposal
2. Confirm schema design
3. Discuss sharing model preferences
4. Begin implementation
