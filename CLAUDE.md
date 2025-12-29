# Linite - Project Specification

> A Ninite-style bulk package installer for Linux distributions

## Overview

Linite is a web application that allows users to select multiple applications from a curated catalog, choose their Linux distribution and preferred package sources, and receive a single command to install all selected packages. The platform focuses on quality over quantity—featuring only admin-curated applications with rich metadata.

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: Zustand (for client-side selection state)
- **Form Handling**: React Hook Form + Zod validation
- **Icons**: Lucide React

### Backend
- **API**: Next.js API Routes (App Router)
- **ORM**: Drizzle ORM
- **Database**:
    - Production: Turso (libSQL)
    - Development: SQLite
- **Authentication**: BetterAuth (email/password)
- **Background Jobs**: Vercel Cron (for periodic data refresh)

### Infrastructure
- **Hosting**: Vercel
- **Image Storage**: Vercel Blob (for app icons)
- **Analytics**: Vercel Analytics (optional)
- **Rate Limiting**: Vercel KV or Upstash Redis

### External APIs
- **Flathub API**: `https://flathub.org/api/v2/`
- **Snapcraft API**: `https://api.snapcraft.io/v2/`
- **Repology API**: `https://repology.org/api/v1/`
- **AUR RPC**: `https://aur.archlinux.org/rpc/`

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  categories │       │    apps     │       │  packages   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ categoryId  │       │ id (PK)     │
│ name        │       │ id (PK)     │◄──────│ appId (FK)  │
│ slug        │       │ slug        │       │ sourceId    │
│ icon        │       │ displayName │       │ identifier  │
│ description │       │ description │       │ version     │
│ displayOrder│       │ iconUrl     │       │ size        │
│ createdAt   │       │ homepage    │       │ maintainer  │
│ updatedAt   │       │ isPopular   │       │ isAvailable │
└─────────────┘       │ isFoss      │       │ lastChecked │
                      │ createdAt   │       │ metadata    │
                      │ updatedAt   │       │ createdAt   │
                      └─────────────┘       │ updatedAt   │
                                            └─────────────┘
                                                   │
                                                   ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   distros   │       │distroSources│       │   sources   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ distroId    │───────│ id (PK)     │
│ name        │       │ sourceId    │       │ name        │
│ slug        │       │ priority    │       │ slug        │
│ family      │       │ isDefault   │       │ installCmd  │
│ iconUrl     │       └─────────────┘       │ requireSudo │
│ basedOn     │                             │ setupCmd    │
│ isPopular   │                             │ priority    │
│ createdAt   │                             │ apiEndpoint │
│ updatedAt   │                             │ createdAt   │
└─────────────┘                             │ updatedAt   │
                                            └─────────────┘

┌─────────────┐       ┌─────────────┐
│    user     │       │   session   │
├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ userId (FK) │
│ email       │       │ id (PK)     │
│ name        │       │ expiresAt   │
│ password    │       │ ipAddress   │
│ role        │       │ userAgent   │
│ createdAt   │       │ createdAt   │
│ updatedAt   │       │ updatedAt   │
└─────────────┘       └─────────────┘

┌─────────────┐
│ refreshLogs │
├─────────────┤
│ id (PK)     │
│ sourceId    │
│ status      │
│ packagesUpd │
│ errorMsg    │
│ startedAt   │
│ completedAt │
└─────────────┘
```

### Drizzle Schema

```typescript
// src/db/schema.ts

import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// Helper for timestamps
const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).$onUpdateFn(() => new Date()),
};

// ============ AUTH TABLES (BetterAuth) ============

export const user = sqliteTable('user', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  name: text('name'),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  image: text('image'),
  role: text('role', { enum: ['admin', 'superadmin'] }).default('admin'),
  ...timestamps,
});

export const session = sqliteTable('session', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  ...timestamps,
});

export const account = sqliteTable('account', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  ...timestamps,
});

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ...timestamps,
});

// ============ APP TABLES ============

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  icon: text('icon'),
  description: text('description'),
  displayOrder: integer('display_order').default(0),
  ...timestamps,
});

export const apps = sqliteTable('apps', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  slug: text('slug').notNull().unique(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  iconUrl: text('icon_url'),
  homepage: text('homepage'),
  isPopular: integer('is_popular', { mode: 'boolean' }).default(false),
  isFoss: integer('is_foss', { mode: 'boolean' }).default(true),
  categoryId: text('category_id').notNull().references(() => categories.id),
  ...timestamps,
});

export const sources = sqliteTable('sources', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  installCmd: text('install_cmd').notNull(),
  requireSudo: integer('require_sudo', { mode: 'boolean' }).default(false),
  setupCmd: text('setup_cmd'),
  priority: integer('priority').default(0),
  apiEndpoint: text('api_endpoint'),
  ...timestamps,
});

export const packages = sqliteTable('packages', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  appId: text('app_id').notNull().references(() => apps.id, { onDelete: 'cascade' }),
  sourceId: text('source_id').notNull().references(() => sources.id),
  identifier: text('identifier').notNull(), // e.g., "org.mozilla.firefox" for flatpak
  version: text('version'),
  size: integer('size'), // in bytes
  maintainer: text('maintainer'),
  isAvailable: integer('is_available', { mode: 'boolean' }).default(true),
  lastChecked: integer('last_checked', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  metadata: text('metadata', { mode: 'json' }), // additional source-specific data
  ...timestamps,
});

export const distros = sqliteTable('distros', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  family: text('family').notNull(), // "debian", "rhel", "arch", "independent"
  iconUrl: text('icon_url'),
  basedOn: text('based_on'), // parent distro slug
  isPopular: integer('is_popular', { mode: 'boolean' }).default(false),
  ...timestamps,
});

export const distroSources = sqliteTable('distro_sources', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  distroId: text('distro_id').notNull().references(() => distros.id, { onDelete: 'cascade' }),
  sourceId: text('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  priority: integer('priority').default(0),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
});

export const refreshLogs = sqliteTable('refresh_logs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  sourceId: text('source_id'),
  status: text('status').notNull(), // "started", "completed", "failed"
  packagesUpdated: integer('packages_updated').default(0),
  errorMessage: text('error_message'),
  startedAt: integer('started_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

// ============ RELATIONS ============

export const categoriesRelations = relations(categories, ({ many }) => ({
  apps: many(apps),
}));

export const appsRelations = relations(apps, ({ one, many }) => ({
  category: one(categories, {
    fields: [apps.categoryId],
    references: [categories.id],
  }),
  packages: many(packages),
}));

export const sourcesRelations = relations(sources, ({ many }) => ({
  packages: many(packages),
  distroSources: many(distroSources),
}));

export const packagesRelations = relations(packages, ({ one }) => ({
  app: one(apps, {
    fields: [packages.appId],
    references: [apps.id],
  }),
  source: one(sources, {
    fields: [packages.sourceId],
    references: [sources.id],
  }),
}));

export const distrosRelations = relations(distros, ({ many }) => ({
  distroSources: many(distroSources),
}));

export const distroSourcesRelations = relations(distroSources, ({ one }) => ({
  distro: one(distros, {
    fields: [distroSources.distroId],
    references: [distros.id],
  }),
  source: one(sources, {
    fields: [distroSources.sourceId],
    references: [sources.id],
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
```

### Drizzle Configuration

```typescript
// drizzle.config.ts

import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'turso',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
} satisfies Config;
```

### Database Client

```typescript
// src/db/index.ts

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

export * from './schema';
```

---

## Repository Structure

```
linite/
├── .github/
│   └── workflows/
│       └── ci.yml                    # CI/CD pipeline
├── drizzle/                          # Generated migrations
│   └── migrations/
├── public/
│   ├── icons/
│   │   ├── distros/                  # Distro logos
│   │   └── sources/                  # Source logos (flatpak, snap, etc.)
│   └── og-image.png
├── src/
│   ├── app/
│   │   ├── (public)/                 # Public routes group
│   │   │   ├── page.tsx              # Homepage - app selector
│   │   │   ├── layout.tsx
│   │   │   └── apps/
│   │   │       └── [slug]/
│   │   │           └── page.tsx      # Individual app detail page
│   │   ├── admin/                    # Admin routes (protected)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx              # Admin dashboard
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # Admin login page
│   │   │   ├── apps/
│   │   │   │   ├── page.tsx          # App management list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Add new app
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx  # Edit app
│   │   │   ├── packages/
│   │   │   │   └── page.tsx          # Package management
│   │   │   ├── distros/
│   │   │   │   └── page.tsx          # Distro management
│   │   │   ├── sources/
│   │   │   │   └── page.tsx          # Source management
│   │   │   ├── categories/
│   │   │   │   └── page.tsx          # Category management
│   │   │   └── refresh/
│   │   │       └── page.tsx          # Manual refresh trigger + logs
│   │   ├── api/
│   │   │   ├── apps/
│   │   │   │   ├── route.ts          # GET all, POST new
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts      # GET, PUT, DELETE single
│   │   │   ├── packages/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── distros/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── sources/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── categories/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── distro-sources/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts
│   │   │   ├── generate/
│   │   │   │   └── route.ts          # Generate install command
│   │   │   ├── search/
│   │   │   │   └── route.ts          # Search external APIs
│   │   │   ├── refresh/
│   │   │   │   └── route.ts          # Trigger data refresh
│   │   │   ├── cron/
│   │   │   │   └── refresh/
│   │   │   │       └── route.ts      # Vercel cron endpoint
│   │   │   └── auth/
│   │   │       └── [...all]/
│   │   │           └── route.ts      # BetterAuth catch-all
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   ├── app-card.tsx              # App display card
│   │   ├── app-grid.tsx              # Grid of app cards
│   │   ├── app-detail-modal.tsx      # Rich app metadata modal
│   │   ├── category-filter.tsx       # Category sidebar/tabs
│   │   ├── distro-selector.tsx       # Distro dropdown
│   │   ├── source-preference.tsx     # Source priority selector
│   │   ├── command-output.tsx        # Generated command display
│   │   ├── selection-summary.tsx     # Selected apps summary
│   │   ├── search-bar.tsx            # App search
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   └── admin/
│   │       ├── app-form.tsx          # Add/edit app form
│   │       ├── package-form.tsx      # Add/edit package form
│   │       ├── data-table.tsx        # Reusable admin table
│   │       ├── sidebar.tsx           # Admin navigation
│   │       ├── stats-cards.tsx       # Dashboard stats
│   │       ├── login-form.tsx        # Email/password login
│   │       └── refresh-status.tsx    # Refresh job status
│   ├── db/
│   │   ├── index.ts                  # Drizzle client
│   │   └── schema.ts                 # Drizzle schema
│   ├── lib/
│   │   ├── auth.ts                   # BetterAuth config
│   │   ├── auth-client.ts            # BetterAuth client
│   │   ├── utils.ts                  # General utilities
│   │   └── constants.ts              # App constants
│   ├── services/
│   │   ├── command-generator.ts      # Install command generation logic
│   │   ├── package-refresh.ts        # Background refresh logic
│   │   └── external-apis/
│   │       ├── flathub.ts            # Flathub API client
│   │       ├── snapcraft.ts          # Snapcraft API client
│   │       ├── repology.ts           # Repology API client
│   │       ├── aur.ts                # AUR RPC client
│   │       └── types.ts              # Shared API types
│   ├── stores/
│   │   └── selection-store.ts        # Zustand store for selections
│   ├── hooks/
│   │   ├── use-apps.ts               # App data fetching
│   │   ├── use-selection.ts          # Selection management
│   │   └── use-command.ts            # Command generation
│   └── types/
│       ├── app.ts
│       ├── package.ts
│       ├── distro.ts
│       └── api.ts
├── .env.example
├── .env.local
├── .gitignore
├── drizzle.config.ts
├── next.config.js
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json
└── README.md
```

---

## Authentication with BetterAuth

### BetterAuth Server Configuration

```typescript
// src/lib/auth.ts

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';
import * as schema from '@/db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true in production
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});

export type Session = typeof auth.$Infer.Session;
```

### BetterAuth Client

```typescript
// src/lib/auth-client.ts

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

### Auth API Route

```typescript
// src/app/api/auth/[...all]/route.ts

import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
```

### Protected Route Middleware

```typescript
// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  // Only protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Skip login page
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next();
    }

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

### Admin Login Page

```typescript
// src/app/admin/login/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message);
      } else {
        router.push('/admin');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Linite Admin</CardTitle>
          <CardDescription>Sign in to manage applications</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Core Features

### 1. Public Interface

#### Homepage (App Selector)
- Grid layout of curated applications organized by category
- Each app card displays: icon, name, short description, FOSS badge, popularity indicator
- Checkbox selection for bulk operations
- Category filtering via sidebar or tabs
- Search functionality with instant filtering
- Distro selector dropdown (with auto-detection hint)
- Source preference toggle (Flatpak preferred / Native preferred / Snap preferred)

#### App Detail Modal/Page
- Full description
- Version history (from package metadata)
- Available sources with individual version info
- Package size per source
- Maintainer information
- Homepage link
- License information
- Direct "Add to selection" button

#### Command Generation
- Selected apps summary panel (collapsible)
- Real-time command preview
- Copy to clipboard button
- Option to download as shell script
- Explanation of what the command does
- Warning for packages requiring additional setup

### 2. Admin Panel

#### Dashboard
- Total apps, packages, distros counts
- Recent activity log
- Last refresh status and timestamp
- Quick actions (trigger refresh, add app)

#### App Management
- Sortable, filterable data table of all apps
- Inline quick actions (edit, delete, toggle popular)
- Add new app form:
    - Basic info (name, slug, description, homepage)
    - Category selection
    - Icon upload or URL
    - FOSS toggle
    - Popularity toggle
- Edit app form (same as add)
- Delete confirmation with cascade warning

#### Package Management
- View all packages across apps
- Filter by source, availability status
- Manual add package to existing app:
    - Select app
    - Select source
    - Enter package identifier
    - Optional: manually enter version, size, maintainer
- "Lookup" button to fetch metadata from external API
- Bulk refresh button per source
- Delete package

#### Source Management
- CRUD for package sources
- Edit install command templates
- Set default priorities
- Configure API endpoints

#### Distro Management
- CRUD for distributions
- Assign available sources per distro
- Set default source per distro
- Upload distro icons

#### Category Management
- CRUD for categories
- Drag-and-drop reordering
- Icon selection

#### Refresh Management
- Manual trigger for full refresh
- Per-source refresh buttons
- Refresh history/logs table
- Error reporting

### 3. API Endpoints

All endpoints follow RESTful conventions. Admin endpoints require authentication.

#### Public Endpoints

```
GET  /api/apps
     Query: ?category=<slug>&popular=true&search=<term>
     Returns: Array of apps with their packages

GET  /api/apps/[id]
     Returns: Single app with full metadata and all packages

GET  /api/distros
     Returns: Array of distros with their available sources

GET  /api/sources
     Returns: Array of sources

GET  /api/categories
     Returns: Array of categories

POST /api/generate
     Body: { distroSlug, sourcePreference, appIds[] }
     Returns: { command, warnings[], setupCommands[] }
```

#### Admin Endpoints (Protected)

```
POST   /api/apps
       Body: { slug, displayName, description?, iconUrl?, homepage?, isPopular?, isFoss?, categoryId }

PUT    /api/apps/[id]
       Body: { slug?, displayName?, description?, iconUrl?, homepage?, isPopular?, isFoss?, categoryId? }

DELETE /api/apps/[id]

POST   /api/packages
       Body: { appId, sourceId, identifier, version?, size?, maintainer?, metadata? }

PUT    /api/packages/[id]
       Body: { identifier?, version?, size?, maintainer?, isAvailable?, metadata? }

DELETE /api/packages/[id]

POST   /api/sources
       Body: { name, slug, installCmd, requireSudo?, setupCmd?, priority?, apiEndpoint? }

PUT    /api/sources/[id]
DELETE /api/sources/[id]

POST   /api/distros
       Body: { name, slug, family, iconUrl?, basedOn?, isPopular? }

PUT    /api/distros/[id]
DELETE /api/distros/[id]

POST   /api/distro-sources
       Body: { distroId, sourceId, priority?, isDefault? }

PUT    /api/distro-sources/[id]
DELETE /api/distro-sources/[id]

POST   /api/categories
       Body: { name, slug, icon?, description?, displayOrder? }

PUT    /api/categories/[id]
DELETE /api/categories/[id]

POST   /api/search
       Body: { source, query }
       Returns: Package metadata from external API

POST   /api/refresh
       Body: { sourceSlug? }  // optional, refreshes all if not provided

GET    /api/refresh/logs
       Returns: Recent refresh job logs
```

---

## Command Generation Logic

### Algorithm

```typescript
// src/services/command-generator.ts

import { db, apps, packages, sources, distros, distroSources } from '@/db';
import { eq, and, inArray } from 'drizzle-orm';

interface GenerateCommandInput {
  distroSlug: string;
  sourcePreference: 'flatpak' | 'native' | 'snap' | 'auto';
  appIds: string[];
}

interface GenerateCommandOutput {
  commands: string[];           // Array of commands to run
  setupCommands: string[];      // Pre-requisite commands (e.g., enable flatpak)
  warnings: string[];           // Packages not found, etc.
  breakdown: {                  // For UI display
    source: string;
    packages: string[];
  }[];
}

export async function generateCommand(input: GenerateCommandInput): Promise<GenerateCommandOutput> {
  const { distroSlug, sourcePreference, appIds } = input;

  // 1. Get distro and its available sources with priorities
  const distro = await db.query.distros.findFirst({
    where: eq(distros.slug, distroSlug),
    with: {
      distroSources: {
        with: {
          source: true,
        },
        orderBy: (ds, { desc }) => [desc(ds.priority)],
      },
    },
  });

  if (!distro) {
    return { commands: [], setupCommands: [], warnings: ['Distro not found'], breakdown: [] };
  }

  // 2. Get all requested apps with their packages
  const requestedApps = await db.query.apps.findMany({
    where: inArray(apps.id, appIds),
    with: {
      packages: {
        where: eq(packages.isAvailable, true),
        with: {
          source: true,
        },
      },
    },
  });

  // 3. Build source priority map based on preference
  const sourcePriority = buildSourcePriority(distro.distroSources, sourcePreference);

  // 4. For each app, select the best package
  const selectedPackages: Map<string, { pkg: typeof packages.$inferSelect; source: typeof sources.$inferSelect }> = new Map();
  const warnings: string[] = [];

  for (const app of requestedApps) {
    const availablePackages = app.packages.filter(pkg => 
      sourcePriority.has(pkg.sourceId)
    );

    if (availablePackages.length === 0) {
      warnings.push(`${app.displayName}: No package available for ${distro.name}`);
      continue;
    }

    // Sort by source priority and pick the first
    availablePackages.sort((a, b) => 
      (sourcePriority.get(b.sourceId) ?? 0) - (sourcePriority.get(a.sourceId) ?? 0)
    );

    const best = availablePackages[0];
    selectedPackages.set(app.id, { pkg: best, source: best.source });
  }

  // 5. Group by source
  const bySource: Map<string, { source: typeof sources.$inferSelect; identifiers: string[] }> = new Map();
  
  for (const { pkg, source } of selectedPackages.values()) {
    if (!bySource.has(source.id)) {
      bySource.set(source.id, { source, identifiers: [] });
    }
    bySource.get(source.id)!.identifiers.push(pkg.identifier);
  }

  // 6. Generate commands
  const commands: string[] = [];
  const setupCommands: string[] = [];
  const breakdown: { source: string; packages: string[] }[] = [];

  for (const { source, identifiers } of bySource.values()) {
    // Add setup command if needed
    if (source.setupCmd) {
      setupCommands.push(source.setupCmd);
    }

    // Generate install command
    const sudo = source.requireSudo ? 'sudo ' : '';
    const cmd = `${sudo}${source.installCmd} ${identifiers.join(' ')}`;
    commands.push(cmd);

    breakdown.push({
      source: source.name,
      packages: identifiers,
    });
  }

  return {
    commands,
    setupCommands: [...new Set(setupCommands)], // dedupe
    warnings,
    breakdown,
  };
}

function buildSourcePriority(
  distroSources: Array<{ sourceId: string; priority: number; source: { slug: string } }>,
  preference: string
): Map<string, number> {
  const priority = new Map<string, number>();
  
  for (const ds of distroSources) {
    let score = ds.priority;
    
    // Boost score based on preference
    if (preference === 'flatpak' && ds.source.slug === 'flatpak') score += 100;
    if (preference === 'snap' && ds.source.slug === 'snap') score += 100;
    if (preference === 'native' && !['flatpak', 'snap'].includes(ds.source.slug)) score += 100;
    
    priority.set(ds.sourceId, score);
  }
  
  return priority;
}
```

### Example Output

```bash
# Setup (if needed)
sudo apt install flatpak
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo

# Install command
sudo apt install -y git curl vim htop && \
flatpak install -y flathub org.mozilla.firefox org.gimp.GIMP org.videolan.VLC
```

---

## Periodic Data Refresh

### Vercel Cron Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/refresh",
      "schedule": "0 4 * * *"
    }
  ]
}
```

### Cron Endpoint

```typescript
// src/app/api/cron/refresh/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { refreshAllPackages } from '@/services/package-refresh';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await refreshAllPackages();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}
```

### Refresh Service

```typescript
// src/services/package-refresh.ts

import { db, packages, sources, refreshLogs } from '@/db';
import { eq } from 'drizzle-orm';
import { getFlathubApp } from './external-apis/flathub';
import { getSnapInfo } from './external-apis/snapcraft';
import { getRepologyProject } from './external-apis/repology';

export async function refreshAllPackages() {
  const log = await db.insert(refreshLogs).values({
    status: 'started',
  }).returning();

  const logId = log[0].id;
  let packagesUpdated = 0;
  let errorMessage: string | null = null;

  try {
    const allPackages = await db.query.packages.findMany({
      with: { source: true },
    });

    for (const pkg of allPackages) {
      try {
        const metadata = await fetchPackageMetadata(pkg.source.slug, pkg.identifier);
        
        if (metadata) {
          await db.update(packages)
            .set({
              version: metadata.version,
              size: metadata.size,
              maintainer: metadata.maintainer,
              isAvailable: true,
              lastChecked: new Date(),
            })
            .where(eq(packages.id, pkg.id));
          
          packagesUpdated++;
        } else {
          // Mark as unavailable if not found
          await db.update(packages)
            .set({
              isAvailable: false,
              lastChecked: new Date(),
            })
            .where(eq(packages.id, pkg.id));
        }
      } catch (err) {
        console.error(`Failed to refresh package ${pkg.identifier}:`, err);
        // Continue with other packages
      }
    }

    await db.update(refreshLogs)
      .set({
        status: 'completed',
        packagesUpdated,
        completedAt: new Date(),
      })
      .where(eq(refreshLogs.id, logId));

  } catch (err) {
    errorMessage = err instanceof Error ? err.message : 'Unknown error';
    await db.update(refreshLogs)
      .set({
        status: 'failed',
        errorMessage,
        completedAt: new Date(),
      })
      .where(eq(refreshLogs.id, logId));
  }

  return { packagesUpdated, errorMessage };
}

async function fetchPackageMetadata(sourceSlug: string, identifier: string) {
  switch (sourceSlug) {
    case 'flatpak':
      return getFlathubApp(identifier);
    case 'snap':
      return getSnapInfo(identifier);
    case 'apt':
    case 'dnf':
    case 'pacman':
    case 'zypper':
      return getRepologyPackage(identifier, sourceSlug);
    default:
      return null;
  }
}
```

---

## External API Clients

### Flathub Client

```typescript
// src/services/external-apis/flathub.ts

const FLATHUB_API = 'https://flathub.org/api/v2';

interface FlathubAppResponse {
  id: string;
  name: string;
  summary: string;
  currentReleaseVersion: string;
  downloadSize: number;
  developerName: string;
  icon: string;
}

interface PackageMetadata {
  version: string | null;
  size: number | null;
  maintainer: string | null;
  iconUrl: string | null;
}

export async function getFlathubApp(appId: string): Promise<PackageMetadata | null> {
  try {
    const res = await fetch(`${FLATHUB_API}/appstream/${appId}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    
    if (!res.ok) return null;
    
    const data: FlathubAppResponse = await res.json();
    
    return {
      version: data.currentReleaseVersion,
      size: data.downloadSize,
      maintainer: data.developerName,
      iconUrl: data.icon,
    };
  } catch {
    return null;
  }
}

export async function searchFlathub(query: string): Promise<FlathubAppResponse[]> {
  try {
    const res = await fetch(`${FLATHUB_API}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
```

### Snapcraft Client

```typescript
// src/services/external-apis/snapcraft.ts

const SNAPCRAFT_API = 'https://api.snapcraft.io/v2';

interface SnapInfo {
  name: string;
  title: string;
  summary: string;
  version: string;
  publisher: { displayName: string };
  media: Array<{ type: string; url: string }>;
}

export async function getSnapInfo(snapName: string) {
  try {
    const res = await fetch(`${SNAPCRAFT_API}/snaps/info/${snapName}`, {
      headers: {
        'Snap-Device-Series': '16',
        'Content-Type': 'application/json',
      },
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const snap = data.snap;
    
    return {
      version: snap.version,
      size: null, // Not easily available in API
      maintainer: snap.publisher?.displayName,
      iconUrl: snap.media?.find((m: any) => m.type === 'icon')?.url,
    };
  } catch {
    return null;
  }
}

export async function searchSnap(query: string) {
  try {
    const res = await fetch(`${SNAPCRAFT_API}/snaps/find?q=${encodeURIComponent(query)}`, {
      headers: {
        'Snap-Device-Series': '16',
        'Content-Type': 'application/json',
      },
    });
    
    if (!res.ok) return [];
    
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}
```

### Repology Client

```typescript
// src/services/external-apis/repology.ts

const REPOLOGY_API = 'https://repology.org/api/v1';

interface RepologyPackage {
  repo: string;
  name: string;
  version: string;
  status: 'newest' | 'outdated' | 'legacy' | 'unique' | 'devel' | 'incorrect';
  maintainers?: string[];
}

// Map repology repo names to our source slugs
const REPO_TO_SOURCE: Record<string, string> = {
  'ubuntu_24_04': 'apt',
  'ubuntu_24_10': 'apt',
  'debian_12': 'apt',
  'debian_13': 'apt',
  'fedora_40': 'dnf',
  'fedora_41': 'dnf',
  'arch': 'pacman',
  'aur': 'aur',
  'opensuse_tumbleweed': 'zypper',
  'opensuse_leap_15_6': 'zypper',
};

const SOURCE_TO_REPOS: Record<string, string[]> = {
  'apt': ['ubuntu_24_04', 'ubuntu_24_10', 'debian_12', 'debian_13'],
  'dnf': ['fedora_40', 'fedora_41'],
  'pacman': ['arch'],
  'aur': ['aur'],
  'zypper': ['opensuse_tumbleweed', 'opensuse_leap_15_6'],
};

export async function getRepologyProject(projectName: string): Promise<RepologyPackage[]> {
  try {
    const res = await fetch(`${REPOLOGY_API}/project/${projectName}`, {
      next: { revalidate: 3600 },
    });
    
    if (!res.ok) return [];
    
    return res.json();
  } catch {
    return [];
  }
}

export async function getRepologyPackage(projectName: string, sourceSlug: string) {
  const packages = await getRepologyProject(projectName);
  
  const relevantRepos = SOURCE_TO_REPOS[sourceSlug] || [];
  const relevantPackages = packages.filter(p => relevantRepos.includes(p.repo));
  
  if (relevantPackages.length === 0) return null;
  
  // Prefer "newest" status
  const best = relevantPackages.find(p => p.status === 'newest') || relevantPackages[0];
  
  return {
    version: best.version,
    size: null,
    maintainer: best.maintainers?.[0] || null,
    iconUrl: null,
  };
}

export function mapRepoToSource(repo: string): string | null {
  return REPO_TO_SOURCE[repo] ?? null;
}
```

### AUR Client

```typescript
// src/services/external-apis/aur.ts

const AUR_RPC = 'https://aur.archlinux.org/rpc';

interface AURPackage {
  Name: string;
  Version: string;
  Description: string;
  Maintainer: string;
  URL: string;
}

export async function getAURPackage(packageName: string) {
  try {
    const res = await fetch(`${AUR_RPC}?v=5&type=info&arg=${packageName}`);
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const pkg = data.results?.[0];
    
    if (!pkg) return null;
    
    return {
      version: pkg.Version,
      size: null,
      maintainer: pkg.Maintainer,
      iconUrl: null,
    };
  } catch {
    return null;
  }
}

export async function searchAUR(query: string): Promise<AURPackage[]> {
  try {
    const res = await fetch(`${AUR_RPC}?v=5&type=search&arg=${encodeURIComponent(query)}`);
    
    if (!res.ok) return [];
    
    const data = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}
```

---

## UI Components Specification

### App Card

```tsx
// src/components/app-card.tsx

interface AppCardProps {
  app: {
    id: string;
    slug: string;
    displayName: string;
    description: string | null;
    iconUrl: string | null;
    isPopular: boolean;
    isFoss: boolean;
    category: { name: string };
    packages: Array<{ source: { name: string; slug: string } }>;
  };
  isSelected: boolean;
  onSelect: (id: string) => void;
  onViewDetails: (id: string) => void;
}

// Visual elements:
// - Checkbox in top-left corner
// - App icon (48x48) with fallback
// - App name (truncated if long)
// - Short description (2 lines max)
// - Badges: FOSS (green), Popular (yellow star)
// - Available sources as small icons in bottom-right
// - Hover state: slight elevation, border highlight
// - Click card to select, "Details" button for modal
```

### Command Output

```tsx
// src/components/command-output.tsx

interface CommandOutputProps {
  commands: string[];
  setupCommands: string[];
  warnings: string[];
  breakdown: Array<{ source: string; packages: string[] }>;
}

// Visual elements:
// - Dark code block background (zinc-900)
// - Syntax highlighting for bash
// - Copy button with "Copied!" feedback toast
// - Download as .sh button
// - Collapsible "What this does" explanation
// - Warning alerts (yellow) for any issues
// - Breakdown showing which packages come from which source
```

### Distro Selector

```tsx
// src/components/distro-selector.tsx

interface DistroSelectorProps {
  distros: Array<{
    id: string;
    name: string;
    slug: string;
    iconUrl: string | null;
    family: string;
    isPopular: boolean;
  }>;
  selectedSlug: string;
  onSelect: (slug: string) => void;
}

// Visual elements:
// - Combobox with search functionality
// - Distro icons next to names
// - Popular distros shown first
// - Grouped by family (Debian-based, RHEL-based, Arch-based, etc.)
// - "Auto-detect" option that shows detection hint
```

### Selection Store (Zustand)

```typescript
// src/stores/selection-store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SelectionState {
  selectedAppIds: Set<string>;
  distroSlug: string;
  sourcePreference: 'flatpak' | 'native' | 'snap' | 'auto';
  
  // Actions
  toggleApp: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  setDistro: (slug: string) => void;
  setSourcePreference: (pref: 'flatpak' | 'native' | 'snap' | 'auto') => void;
}

export const useSelectionStore = create<SelectionState>()(
  persist(
    (set) => ({
      selectedAppIds: new Set(),
      distroSlug: 'ubuntu',
      sourcePreference: 'auto',

      toggleApp: (id) =>
        set((state) => {
          const newSet = new Set(state.selectedAppIds);
          if (newSet.has(id)) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return { selectedAppIds: newSet };
        }),

      selectAll: (ids) =>
        set(() => ({ selectedAppIds: new Set(ids) })),

      clearSelection: () =>
        set(() => ({ selectedAppIds: new Set() })),

      setDistro: (slug) =>
        set(() => ({ distroSlug: slug })),

      setSourcePreference: (pref) =>
        set(() => ({ sourcePreference: pref })),
    }),
    {
      name: 'linite-selection',
      partialize: (state) => ({
        distroSlug: state.distroSlug,
        sourcePreference: state.sourcePreference,
      }),
    }
  )
);
```

---

## Environment Variables

```bash
# .env.example

# Database (SQLite for dev, Turso for prod)
DATABASE_URL="file:./dev.db"
# For Turso production:
# DATABASE_URL="libsql://your-db.turso.io"
# DATABASE_AUTH_TOKEN="your-token"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# BetterAuth
BETTER_AUTH_SECRET="your-secret-here-min-32-chars"

# Vercel Blob (for icon uploads)
BLOB_READ_WRITE_TOKEN="your-token"

# Cron secret (to secure cron endpoint)
CRON_SECRET="your-cron-secret"

# Rate limiting (optional)
KV_REST_API_URL="your-upstash-url"
KV_REST_API_TOKEN="your-upstash-token"
```

---

## Initial Data Reference

Instead of a fixed seed script, here's reference data for an LLM to populate the database while testing:

### Sources Reference

| Name     | Slug     | Install Command                                    | Requires Sudo | Setup Command                                                                 |
|----------|----------|----------------------------------------------------|---------------|-------------------------------------------------------------------------------|
| Flatpak  | flatpak  | `flatpak install -y flathub`                       | false         | `flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo` |
| Snap     | snap     | `snap install`                                     | true          | null                                                                          |
| APT      | apt      | `apt install -y`                                   | true          | null                                                                          |
| DNF      | dnf      | `dnf install -y`                                   | true          | null                                                                          |
| Pacman   | pacman   | `pacman -S --noconfirm`                            | true          | null                                                                          |
| Zypper   | zypper   | `zypper install -y`                                | true          | null                                                                          |
| AUR      | aur      | `yay -S --noconfirm`                               | false         | `sudo pacman -S --needed git base-devel && git clone https://aur.archlinux.org/yay.git && cd yay && makepkg -si` |

### Distros Reference

| Name         | Slug         | Family     | Based On | Popular |
|--------------|--------------|------------|----------|---------|
| Ubuntu       | ubuntu       | debian     | debian   | true    |
| Debian       | debian       | debian     | null     | true    |
| Linux Mint   | linuxmint    | debian     | ubuntu   | true    |
| Pop!_OS      | pop          | debian     | ubuntu   | true    |
| Fedora       | fedora       | rhel       | null     | true    |
| Arch Linux   | arch         | arch       | null     | true    |
| Manjaro      | manjaro      | arch       | arch     | true    |
| EndeavourOS  | endeavouros  | arch       | arch     | false   |
| openSUSE     | opensuse     | suse       | null     | false   |
| Zorin OS     | zorin        | debian     | ubuntu   | false   |
| Elementary   | elementary   | debian     | ubuntu   | false   |
| Nobara       | nobara       | rhel       | fedora   | false   |

### Distro-Source Mappings Reference

| Distro       | Available Sources          | Default  |
|--------------|----------------------------|----------|
| Ubuntu       | apt, flatpak, snap         | apt      |
| Debian       | apt, flatpak               | apt      |
| Linux Mint   | apt, flatpak               | apt      |
| Pop!_OS      | apt, flatpak               | apt      |
| Fedora       | dnf, flatpak               | dnf      |
| Arch Linux   | pacman, flatpak, aur       | pacman   |
| Manjaro      | pacman, flatpak, aur, snap | pacman   |
| openSUSE     | zypper, flatpak            | zypper   |

### Categories Reference

| Name          | Slug          | Icon            | Order |
|---------------|---------------|-----------------|-------|
| Browsers      | browsers      | Globe           | 1     |
| Development   | development   | Code            | 2     |
| Media         | media         | Play            | 3     |
| Graphics      | graphics      | Image           | 4     |
| Office        | office        | FileText        | 5     |
| Utilities     | utilities     | Wrench          | 6     |
| Communication | communication | MessageCircle   | 7     |
| Games         | games         | Gamepad2        | 8     |
| Security      | security      | Shield          | 9     |
| System        | system        | Settings        | 10    |

### Sample Apps Reference

| App Name      | Slug          | Category    | FOSS  | Flatpak ID                  | Snap Name    | APT/DNF Name |
|---------------|---------------|-------------|-------|-----------------------------|--------------|--------------|
| Firefox       | firefox       | browsers    | true  | org.mozilla.firefox         | firefox      | firefox      |
| Chrome        | chrome        | browsers    | false | com.google.Chrome           | null         | google-chrome-stable |
| VS Code       | vscode        | development | false | com.visualstudio.code       | code         | code         |
| VLC           | vlc           | media       | true  | org.videolan.VLC            | vlc          | vlc          |
| GIMP          | gimp          | graphics    | true  | org.gimp.GIMP               | gimp         | gimp         |
| LibreOffice   | libreoffice   | office      | true  | org.libreoffice.LibreOffice | libreoffice  | libreoffice  |
| Discord       | discord       | communication | false | com.discordapp.Discord    | discord      | null         |
| Slack         | slack         | communication | false | com.slack.Slack           | slack        | slack-desktop |
| Spotify       | spotify       | media       | false | com.spotify.Client          | spotify      | null         |
| Steam         | steam         | games       | false | com.valvesoftware.Steam     | null         | steam        |
| OBS Studio    | obs           | media       | true  | com.obsproject.Studio       | obs-studio   | obs-studio   |
| Blender       | blender       | graphics    | true  | org.blender.Blender         | blender      | blender      |
| Inkscape      | inkscape      | graphics    | true  | org.inkscape.Inkscape       | inkscape     | inkscape     |
| Kdenlive      | kdenlive      | media       | true  | org.kde.kdenlive            | kdenlive     | kdenlive     |
| Audacity      | audacity      | media       | true  | org.audacityteam.Audacity   | audacity     | audacity     |
| Git           | git           | development | true  | null                        | null         | git          |
| Node.js       | nodejs        | development | true  | null                        | node         | nodejs       |
| Docker        | docker        | development | true  | null                        | docker       | docker.io    |
| htop          | htop          | system      | true  | null                        | htop         | htop         |
| Neofetch      | neofetch      | system      | true  | null                        | null         | neofetch     |

---

## Development Workflow

### Getting Started

```bash
# Clone and install
git clone <repo>
cd linite
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# Set up database
npx drizzle-kit generate
npx drizzle-kit migrate

# Run development server
npm run dev

# Open Drizzle Studio for DB management
npx drizzle-kit studio
```

### Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

### Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "better-auth": "^1.0.0",
    "drizzle-orm": "^0.30.0",
    "@libsql/client": "^0.5.0",
    "@paralleldrive/cuid2": "^2.2.0",
    "zustand": "^4.5.0",
    "zod": "^3.22.0",
    "react-hook-form": "^7.50.0",
    "@hookform/resolvers": "^3.3.0",
    "lucide-react": "^0.300.0",
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "drizzle-kit": "^0.21.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "autoprefixer": "^10.0.0",
    "postcss": "^8.0.0"
  }
}
```

---

## Deployment Checklist

1. **Turso Setup**
    - Create Turso database: `turso db create linite`
    - Get connection URL: `turso db show linite --url`
    - Create auth token: `turso db tokens create linite`
    - Update environment variables in Vercel

2. **Vercel Configuration**
    - Connect GitHub repo
    - Add all environment variables
    - Configure cron jobs in `vercel.json`

3. **BetterAuth Setup**
    - Generate strong secret (32+ chars)
    - Set `BETTER_AUTH_SECRET` in environment

4. **Initial Admin User**
    - Create first admin via direct DB insert or signup endpoint
    - Use Drizzle Studio or API to add to `user` table with `role: 'superadmin'`

5. **Post-Deploy**
    - Verify cron job is scheduled
    - Test admin login
    - Use admin panel (or LLM) to populate initial data

---

## Future Enhancements

### Phase 2
- [ ] CLI companion tool (`npx linite install --url <selection-url>`)
- [ ] Shareable selection URLs (encoded in query params or short IDs)
- [ ] Export/import as YAML
- [ ] Curated bundles (Developer Setup, Gaming, Creative, etc.)
- [ ] Uninstall command generator