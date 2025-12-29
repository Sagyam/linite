# Repository Structure

```
linite/
├── .github/
│   └── workflows/
│       └── ci.yml                    # CI/CD pipeline
├── drizzle/                          # Generated migrations
│   └── migrations/
├── docs/                             # Project documentation
│   ├── PROJECT_OVERVIEW.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_REFERENCE.md
│   ├── REPOSITORY_STRUCTURE.md
│   ├── INITIAL_DATA.md
│   ├── TASKS.md
│   └── SPEC.md
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
├── CLAUDE.md                          # Essential Claude instructions
└── README.md
```

## Directory Explanations

### /src/app
Next.js App Router structure with route groups for public and admin areas

### /src/components
React components organized by purpose (ui primitives, public components, admin components)

### /src/db
Database client and Drizzle ORM schema

### /src/lib
Shared utilities, authentication config, constants

### /src/services
Business logic for command generation, package refresh, external API clients

### /src/stores
Zustand stores for client-side state management

### /src/hooks
Custom React hooks for data fetching and state management

### /src/types
TypeScript type definitions

### /docs
Project documentation (moved from CLAUDE.md)
