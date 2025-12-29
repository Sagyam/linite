# Implementation Tasks

## Phase 1: Foundation Setup ✅

### 1.1 Project Initialization ✅
- [x] Initialize with bun
- [x] Install core dependencies (Next.js, React, TypeScript)
- [x] Configure Tailwind CSS v4
- [x] Set up ESLint and TypeScript configs
- [x] Create environment variables template

### 1.2 Database Setup ✅
- [x] Install Drizzle ORM and libSQL client
- [x] Create Drizzle configuration
- [x] Implement database schema in `src/db/schema.ts`
- [x] Create database client in `src/db/index.ts`
- [x] Generate initial migrations
- [x] Set up local SQLite for development
- [x] Create seed script with sample data

### 1.3 Authentication Setup ✅
- [x] Install BetterAuth
- [x] Configure BetterAuth server (`src/lib/auth.ts`)
- [x] Configure BetterAuth client (`src/lib/auth-client.ts`)
- [x] Create auth API route (`src/app/api/auth/[...all]/route.ts`)
- [x] Implement middleware for admin route protection
- [x] Create admin login page

## Phase 2: Core API Development ✅

### 2.1 Categories API ✅
- [x] Create GET `/api/categories` endpoint
- [x] Create POST `/api/categories` endpoint (admin)
- [x] Create PUT `/api/categories/[id]` endpoint (admin)
- [x] Create DELETE `/api/categories/[id]` endpoint (admin)

### 2.2 Sources API ✅
- [x] Create GET `/api/sources` endpoint
- [x] Create POST `/api/sources` endpoint (admin)
- [x] Create PUT `/api/sources/[id]` endpoint (admin)
- [x] Create DELETE `/api/sources/[id]` endpoint (admin)

### 2.3 Distros API ✅
- [x] Create GET `/api/distros` endpoint
- [x] Create POST `/api/distros` endpoint (admin)
- [x] Create PUT `/api/distros/[id]` endpoint (admin)
- [x] Create DELETE `/api/distros/[id]` endpoint (admin)

### 2.4 Distro-Sources API ✅
- [x] Create GET `/api/distro-sources` endpoint
- [x] Create POST `/api/distro-sources` endpoint (admin)
- [x] Create PUT `/api/distro-sources/[id]` endpoint (admin)
- [x] Create DELETE `/api/distro-sources/[id]` endpoint (admin)

### 2.5 Apps API ✅
- [x] Create GET `/api/apps` endpoint with filtering
- [x] Create GET `/api/apps/[id]` endpoint
- [x] Create POST `/api/apps` endpoint (admin)
- [x] Create PUT `/api/apps/[id]` endpoint (admin)
- [x] Create DELETE `/api/apps/[id]` endpoint (admin)

### 2.6 Packages API ✅
- [x] Create GET `/api/packages` endpoint
- [x] Create POST `/api/packages` endpoint (admin)
- [x] Create PUT `/api/packages/[id]` endpoint (admin)
- [x] Create DELETE `/api/packages/[id]` endpoint (admin)

## Phase 3: External API Integration ✅

### 3.1 Flathub Integration ✅
- [x] Create Flathub API client (`src/services/external-apis/flathub.ts`)
- [x] Implement app search function
- [x] Implement app metadata fetch function
- [x] Add error handling and caching

### 3.2 Snapcraft Integration ✅
- [x] Create Snapcraft API client (`src/services/external-apis/snapcraft.ts`)
- [x] Implement snap search function
- [x] Implement snap info fetch function
- [x] Add error handling and caching

### 3.3 Repology Integration ✅
- [x] Create Repology API client (`src/services/external-apis/repology.ts`)
- [x] Implement project lookup function
- [x] Implement repo-to-source mapping
- [x] Add error handling and caching

### 3.4 AUR Integration ✅
- [x] Create AUR RPC client (`src/services/external-apis/aur.ts`)
- [x] Implement package search function
- [x] Implement package info fetch function
- [x] Add error handling and caching

### 3.5 Search API ✅
- [x] Create POST `/api/search` endpoint
- [x] Integrate all external API clients
- [x] Implement unified search interface

## Phase 4: Command Generation ✅

### 4.1 Command Generator Service ✅
- [x] Create command generator service (`src/services/command-generator.ts`)
- [x] Implement source priority calculation
- [x] Implement best package selection algorithm
- [x] Implement command grouping by source
- [x] Add setup command generation
- [x] Add warning generation for unavailable packages

### 4.2 Generate API ✅
- [x] Create POST `/api/generate` endpoint
- [x] Validate input (distro, apps, preferences)
- [x] Call command generator service
- [x] Return formatted response

## Phase 5: Background Jobs ✅

### 5.1 Package Refresh Service ✅
- [x] Create package refresh service (`src/services/package-refresh.ts`)
- [x] Implement package metadata fetching logic
- [x] Implement availability checking
- [x] Add refresh logging to database
- [x] Add error handling and retry logic

### 5.2 Refresh API ✅
- [x] Create POST `/api/refresh` endpoint (admin)
- [x] Create GET `/api/refresh/logs` endpoint (admin)
- [x] Implement manual refresh trigger
- [x] Add refresh status tracking

### 5.3 Cron Job ✅
- [x] Create GET `/api/cron/refresh` endpoint
- [x] Add CRON_SECRET verification
- [x] Configure Vercel cron in `vercel.json`
- [x] Test scheduled execution

## Phase 6: UI Components (shadcn/ui) ✅

### 6.1 Base UI Components ✅
- [x] Initialize shadcn/ui
- [x] Install button component
- [x] Install card component
- [x] Install input component
- [x] Install label component
- [x] Install dialog component
- [x] Install select component
- [x] Install table component
- [x] Install tabs component
- [x] Install sonner component (toast replacement)
- [x] Install badge component
- [x] Install checkbox component
- [x] Install form components
- [x] Install textarea component
- [x] Install switch component
- [x] Install dropdown menu component
- [x] Install separator component
- [x] Install skeleton component

### 6.2 Utility Components ✅
- [x] Create header component
- [x] Create footer component
- [x] Create loading spinner component
- [x] Create error display component

## Phase 7: Public Interface ✅

### 7.1 State Management ✅
- [x] Install Zustand
- [x] Create selection store (`src/stores/selection-store.ts`)
- [x] Add app selection actions
- [x] Add distro selection actions
- [x] Add source preference actions
- [x] Add persistence middleware

### 7.2 Custom Hooks ✅
- [x] Create `useApps` hook for data fetching
- [x] Create `useCategories` hook
- [x] Create `useDistros` hook
- [x] Create `useCommand` hook for command generation

### 7.3 App Components ✅
- [x] Create AppCard component
- [x] Create AppGrid component (with integrated search and category filter)
- [x] Create DistroSelector component
- [x] Create SelectionSummary component
- [x] Create Header and Footer components
- [x] Create Loading and Error components

### 7.4 Command Components ✅
- [x] Create CommandOutput component
- [x] Add auto-generation on selection change
- [x] Add copy to clipboard functionality
- [x] Add download as script functionality
- [x] Show setup commands and warnings

### 7.5 Homepage ✅
- [x] Create public layout with Header/Footer
- [x] Create homepage with app grid
- [x] Integrate category filtering (tabs)
- [x] Integrate search
- [x] Integrate distro selection
- [x] Integrate source preference
- [x] Add command generation panel
- [x] Add Toaster notifications

### 7.6 App Detail Page ✅
- [x] Create app detail page route `/apps/[slug]`
- [x] Display full app metadata
- [x] Show available sources with availability status
- [x] Show version information
- [x] Add "Add to selection" button
- [x] Add "Details" button to AppCard
- [x] Links to official website
- [x] Quick actions sidebar

## Phase 8: Admin Interface ✅

### 8.1 Admin Layout ✅
- [x] Create admin layout with sidebar
- [x] Create admin navigation
- [x] Add logout functionality
- [x] Add breadcrumbs

### 8.2 Admin Components ✅
- [x] Create DataTable component (reusable)
- [x] Create StatsCards component
- [x] Create AppForm component
- [x] Create PackageForm component
- [x] Create RefreshStatus component

### 8.3 Admin Dashboard ✅
- [x] Create dashboard page
- [x] Display statistics (total apps, packages, distros)
- [x] Show recent activity
- [x] Show last refresh status
- [x] Add quick action buttons

### 8.4 App Management ✅
- [x] Create app list page
- [x] Add sorting and filtering
- [x] Create add app page
- [x] Create edit app page
- [x] Implement delete with confirmation
- [x] Add search integration for finding packages

### 8.5 Package Management ✅
- [x] Create package list page
- [x] Add filtering by source and availability
- [x] Implement add package form
- [x] Implement edit package form
- [x] Add external API lookup button
- [x] Add bulk refresh per source

### 8.6 Source Management ✅
- [x] Create source list page
- [x] Implement CRUD operations
- [x] Add install command template editor
- [x] Test setup command execution

### 8.7 Distro Management ✅
- [x] Create distro list page
- [x] Implement CRUD operations
- [x] Add source mapping interface
- [x] Set default sources per distro

### 8.8 Category Management ✅
- [x] Create category list page
- [x] Implement CRUD operations
- [x] Add drag-and-drop reordering
- [x] Add icon selector

### 8.9 Refresh Management ✅
- [x] Create refresh page
- [x] Add manual trigger buttons
- [x] Display refresh logs table
- [x] Show error details
- [x] Add per-source refresh

## Phase 9: Testing & Polish ✅

### 9.1 Testing ✅
- [x] Test all public API endpoints
- [x] Test all admin API endpoints
- [x] Test authentication flow
- [x] Test command generation with various scenarios
- [x] Test external API integrations
- [x] Test background refresh job

### 9.2 Error Handling ✅
- [x] Add global error boundary
- [x] Improve API error responses
- [x] Add user-friendly error messages
- [x] Add validation error display

### 9.3 Performance ✅
- [x] Add loading states
- [x] Optimize database queries
- [x] Add pagination where needed
- [x] Implement caching strategies

### 9.4 UX Polish ✅
- [x] Add animations and transitions
- [x] Improve responsive design
- [x] Add keyboard shortcuts
- [x] Add tooltips and help text
- [x] Improve accessibility (ARIA labels, etc.)
- [x] Add a theme switcher

### 9.5 Documentation ✅
- [x] Update README.md with setup instructions
- [x] Document environment variables
- [x] Create deployment guide
- [x] Document API endpoints

## Phase 10: Deployment

### 10.1 Turso Setup
- [ ] Create Turso database
- [ ] Get connection URL and auth token
- [ ] Run migrations on production database
- [ ] Test connection

### 10.2 Vercel Deployment
- [ ] Connect GitHub repository
- [ ] Configure environment variables
- [ ] Set up custom domain (optional)
- [ ] Configure build settings

### 10.3 Post-Deployment
- [ ] Create first admin user
- [ ] Populate initial data (categories, sources, distros)
- [ ] Add initial apps
- [ ] Verify cron job execution
- [ ] Test production deployment

## Phase 11: Future Enhancements

- [ ] CLI companion tool
- [ ] Shareable selection URLs
- [ ] Export/import as YAML
- [ ] Curated bundles
- [ ] Uninstall command generator
- [ ] User accounts and saved selections
- [ ] Package popularity tracking
- [ ] Community suggestions
