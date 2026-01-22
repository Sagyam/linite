# Database Schema

## Entity Relationship Diagram

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
 │ colorLight  │       │ homepage    │       │ maintainer  │
 │ colorDark   │       │ isPopular   │       │ isAvailable │
 │ createdAt   │       │ isFoss      │       │ lastChecked │
 │ updatedAt   │       │ createdAt   │       │ metadata    │
 └─────────────┘       │ updatedAt   │       │ packageSetup│
                       └─────────────┘       │ packageClean│
                              │              │ uninstallMeta│
                              │              │ createdAt   │
                              │              │ updatedAt   │
                              │              └─────────────┘
                              │                     │
                              ▼                     ▼
 ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
 │   distros   │       │distroSources│       │   sources   │
 ├─────────────┤       ├─────────────┤       ├─────────────┤
 │ id (PK)     │◄──────│ distroId    │───────│ id (PK)     │
 │ name        │       │ sourceId    │       │ name        │
 │ slug        │       │ priority    │       │ slug        │
 │ family      │       │ isDefault   │       │ installCmd  │
 │ iconUrl     │       └─────────────┘       │ removeCmd   │
 │ basedOn     │                             │ requireSudo │
 │ isPopular   │                             │ setupCmd    │
 │ themeColorL │                             │ cleanupCmd  │
 │ themeColorD │                             │ supportsDep │
 │ createdAt   │                             │ depCleanup  │
 │ updatedAt   │                             │ priority    │
 └─────────────┘                             │ apiEndpoint │
                                             │ createdAt   │
                                             │ updatedAt   │
                                             └─────────────┘

┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    user     │       │   session   │       │   account   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ userId (FK) │   ┌───│ userId (FK) │
│ email       │       │ id (PK)     │   │   │ id (PK)     │
│ name        │       │ expiresAt   │   │   │ accountId   │
│emailVerified│       │ token       │   │   │ providerId  │
│ image       │       │ ipAddress   │   │   │ accessToken │
│ role        │       │ userAgent   │   │   │refreshToken │
│ createdAt   │       │ createdAt   │   │   │ idToken     │
│ updatedAt   │       │ updatedAt   │   │   │ scope       │
└─────────────┘       └─────────────┘   │   │ createdAt   │
       │                                │   │ updatedAt   │
       │                                │   └─────────────┘
       │                                │
       │                                └──►┌─────────────┐
       │                                    │verification │
       │                                    ├─────────────┤
       │                                    │ id (PK)     │
       │                                    │ identifier  │
       │                                    │ value       │
       │                                    │ expiresAt   │
       │                                    │ createdAt   │
       │                                    │ updatedAt   │
       │                                    └─────────────┘
       │
       ├──────────────────────────────────►┌─────────────────┐
       │                                    │  collections    │
       │                                    ├─────────────────┤
       │                                    │ id (PK)         │
       │                                    │ userId (FK)     │
       │                                    │ name            │
       │                                    │ description     │
       │                                    │ slug            │
       │                                    │ iconUrl         │
       │                                    │ isPublic        │
       │                                    │ isFeatured      │
       │                                    │ isTemplate      │
       │                                    │ shareToken      │
       │                                    │ viewCount       │
       │                                    │ installCount    │
       │                                    │ tags            │
       │                                    │ createdAt       │
       │                                    │ updatedAt       │
       │                                    └─────────────────┘
       │                                           │
       │                                           │
       │      ┌────────────────────────────────────┘
       │      │
       │      ▼
       │  ┌─────────────────┐
       │  │collectionItems  │
       │  ├─────────────────┤
       │  │ id (PK)         │
       │  │ collectionId    │
       │  │ appId (FK)      │
       │  │ displayOrder    │
       │  │ note            │
       │  │ createdAt       │
       │  └─────────────────┘
       │
        └────────────────────────

 ┌─────────────────┐
 │  installations   │
 ├─────────────────┤
 │ id (PK)         │
 │ userId (FK)      │
 │ appId (FK)       │
 │ packageId (FK)   │
 │ distroId (FK)    │
 │ deviceIdentifier │
 │ installedAt      │
 │ notes            │
 │ createdAt        │
 │ updatedAt        │
 └─────────────────┘

┌─────────────────┐
│  refreshLogs    │
├─────────────────┤
│ id (PK)         │
│ sourceId        │
│ status          │
│ packagesUpdated │
│ errorMessage    │
│ startedAt       │
│ completedAt     │
└─────────────────┘
```

## Table Descriptions

### Auth Tables (BetterAuth)

#### user
User accounts with authentication data
- **id**: CUID2 primary key
- **email**: Unique email address
- **name**: Display name
- **emailVerified**: Boolean flag for email verification
- **image**: Profile image URL
- **role**: User role (user, admin, superadmin)
- **createdAt, updatedAt**: Timestamps

#### session
Active user sessions
- **id**: CUID2 primary key
- **userId**: Foreign key to user
- **expiresAt**: Session expiration timestamp
- **token**: Unique session token
- **ipAddress**: IP address of session
- **userAgent**: Browser/client user agent
- **createdAt, updatedAt**: Timestamps

#### account
OAuth provider accounts linked to users
- **id**: CUID2 primary key
- **userId**: Foreign key to user
- **accountId**: Provider account identifier
- **providerId**: OAuth provider identifier
- **accessToken**: OAuth access token
- **refreshToken**: OAuth refresh token
- **idToken**: OpenID Connect ID token
- **accessTokenExpiresAt**: Access token expiration
- **refreshTokenExpiresAt**: Refresh token expiration
- **scope**: OAuth scopes
- **createdAt, updatedAt**: Timestamps

#### verification
Email verification and password reset tokens
- **id**: CUID2 primary key
- **identifier**: Email or user identifier
- **value**: Verification token
- **expiresAt**: Token expiration
- **createdAt, updatedAt**: Timestamps

### App Catalog Tables

#### categories
Organizes apps into logical groups (Browsers, Development, Media, etc.)
- **id**: CUID2 primary key
- **name**: Category name
- **slug**: URL-friendly unique identifier
- **icon**: Icon identifier
- **description**: Category description
- **displayOrder**: Sort order for UI display
- **colorLight**: Light mode category color (hex)
- **colorDark**: Dark mode category color (hex)
- **createdAt, updatedAt**: Timestamps
- **Indexes**: displayOrder

#### apps
The main application catalog - each app can have multiple packages from different sources
- **id**: CUID2 primary key
- **slug**: URL-friendly unique identifier
- **displayName**: Human-readable app name
- **description**: App description
- **iconUrl**: App icon URL (Azure Blob Storage)
- **homepage**: App homepage URL
- **isPopular**: Featured/popular flag
- **isFoss**: Free and Open Source Software flag
- **categoryId**: Foreign key to categories
- **createdAt, updatedAt**: Timestamps
- **Indexes**: categoryId, isPopular, (categoryId + isPopular)

#### packages
Package availability per source (e.g., Firefox from Flatpak, Firefox from APT)
- **id**: CUID2 primary key
- **appId**: Foreign key to apps (cascade delete)
- **sourceId**: Foreign key to sources
- **identifier**: Package identifier in the source system
- **version**: Package version string
- **size**: Package size in bytes
- **maintainer**: Package maintainer name
- **isAvailable**: Availability flag
- **lastChecked**: Last availability check timestamp
- **metadata**: JSON metadata from external APIs
- **packageSetupCmd**: Optional package-level setup (PPAs, COPR repos)
- **packageCleanupCmd**: Reverse of packageSetupCmd (remove PPAs, repos)
- **uninstallMetadata**: Uninstall instructions for script sources ({linux?, windows?, manualInstructions?})
- **createdAt, updatedAt**: Timestamps
- **Indexes**: appId, sourceId, isAvailable, (appId + sourceId)

#### sources
Package sources (Flatpak, Snap, APT, DNF, etc.) with install/uninstall commands
- **id**: CUID2 primary key
- **name**: Source display name
- **slug**: URL-friendly unique identifier
- **installCmd**: Install command template (e.g., "flatpak install {identifier}")
- **removeCmd**: Uninstall command template (e.g., "flatpak uninstall {identifier}")
- **requireSudo**: Boolean flag if sudo is required
- **setupCmd**: Optional setup command (run once before first install)
- **cleanupCmd**: Reverse of setupCmd (remove PPAs, repos, remotes)
- **supportsDependencyCleanup**: Boolean flag for dependency cleanup support
- **dependencyCleanupCmd**: Dependency cleanup command (e.g., "apt autoremove -y")
- **priority**: Global priority for source selection
- **apiEndpoint**: External API endpoint for package data
- **createdAt, updatedAt**: Timestamps

#### distros
Linux distributions with metadata
- **id**: CUID2 primary key
- **name**: Distribution name
- **slug**: URL-friendly unique identifier
- **family**: Distribution family (debian, fedora, arch, etc.)
- **iconUrl**: Distribution logo URL
- **basedOn**: Parent distribution (e.g., "debian" for Ubuntu)
- **isPopular**: Featured/popular flag
- **themeColorLight**: Light mode theme color (hex)
- **themeColorDark**: Dark mode theme color (hex)
- **createdAt, updatedAt**: Timestamps
- **Indexes**: isPopular, family

#### distroSources
Maps which sources are available for each distro with priority
- **id**: CUID2 primary key
- **distroId**: Foreign key to distros (cascade delete)
- **sourceId**: Foreign key to sources (cascade delete)
- **priority**: Source priority for this distro (higher = preferred)
- **isDefault**: Boolean flag for default source
- **NO timestamps** (junction table)
- **Indexes**: distroId, sourceId, (distroId + sourceId)

### Installation Tracking Tables (Authenticated Users)

#### installations
Track user installations across devices (for uninstall feature)
- **id**: CUID2 primary key
- **userId**: Foreign key to user (cascade delete)
- **appId**: Foreign key to apps (cascade delete)
- **packageId**: Foreign key to packages (cascade delete)
- **distroId**: Foreign key to distros
- **deviceIdentifier**: User-provided device name (e.g., "My Laptop")
- **installedAt**: Installation timestamp
- **notes**: Optional user notes
- **createdAt, updatedAt**: Timestamps
- **Indexes**: userId, appId, (userId + deviceIdentifier), (userId + appId + deviceIdentifier)

### Collection Tables

#### collections
User-created app collections (curated lists)
- **id**: CUID2 primary key
- **userId**: Foreign key to user (cascade delete)
- **name**: Collection name
- **description**: Collection description
- **slug**: URL-friendly unique identifier
- **iconUrl**: Collection icon URL
- **isPublic**: Public visibility flag
- **isFeatured**: Featured by admins flag
- **isTemplate**: Official template flag
- **shareToken**: Unique token for sharing private collections
- **viewCount**: Number of views
- **installCount**: Number of times installed
- **tags**: JSON array of tag strings
- **createdAt, updatedAt**: Timestamps
- **Indexes**: userId, slug, isPublic, isFeatured, shareToken

#### collectionItems
Apps within a collection
- **id**: CUID2 primary key
- **collectionId**: Foreign key to collections (cascade delete)
- **appId**: Foreign key to apps (cascade delete)
- **displayOrder**: Sort order within collection
- **note**: Optional note about why app is included
- **createdAt**: Timestamp
- **Indexes**: collectionId, appId, (collectionId + appId)

### System Tables

#### refreshLogs
Tracks background job runs for package metadata updates
- **id**: CUID2 primary key
- **sourceId**: Foreign key to sources (optional, null for full refresh)
- **status**: Job status (success, failed, running)
- **packagesUpdated**: Count of packages updated
- **errorMessage**: Error details if failed
- **startedAt**: Job start timestamp
- **completedAt**: Job completion timestamp
- **Indexes**: sourceId, startedAt

## Key Relationships

### Core Data Flow
- **Categories → Apps**: One category has many apps
- **Apps → Packages**: One app can have multiple packages (one per source)
- **Sources → Packages**: One source provides many packages
- **Distros → DistroSources**: Many-to-many relationship defining available sources per distro
- **Sources → DistroSources**: Sources can be available on multiple distros

### Authentication & User Data
- **Users → Sessions**: One user can have multiple sessions
- **Users → Accounts**: One user can have multiple OAuth accounts
- **Users → Collections**: One user can create multiple collections
- **Users → Installations**: One user can track installations across multiple devices
- **Users → CollectionLikes**: One user can like multiple collections

### Collections System
- **Collections → CollectionItems**: One collection contains many apps
- **Apps → CollectionItems**: One app can be in multiple collections
- **Collections → CollectionLikes**: One collection can be liked by many users

### Background Jobs
- **Sources → RefreshLogs**: Track refresh jobs per source

### Installation Tracking
- **Users → Installations**: One user can track many installations
- **Installations → Apps**: Each installation references an app
- **Installations → Packages**: Each installation references a specific package
- **Installations → Distros**: Each installation is for a specific distro
- **Installations are filtered by device**: User can view installations per device
