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
                                        │   │ updatedAt   │
                                        │   └─────────────┘
                                        │
                                        └──►┌─────────────┐
                                            │verification │
                                            ├─────────────┤
                                            │ id (PK)     │
                                            │ identifier  │
                                            │ value       │
                                            │ expiresAt   │
                                            │ createdAt   │
                                            │ updatedAt   │
                                            └─────────────┘

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

## Core Tables

### categories
Organizes apps into logical groups (Browsers, Development, Media, etc.)

### apps
The main application catalog - each app can have multiple packages from different sources

### packages
Package availability per source (e.g., Firefox from Flatpak, Firefox from APT)

### sources
Package sources (Flatpak, Snap, APT, DNF, etc.) with install command templates

### distros
Linux distributions with metadata

### distroSources
Maps which sources are available for each distro with priority

### user, session, account, verification
BetterAuth authentication tables

### refreshLogs
Tracks background job runs for package metadata updates

## Key Relationships

- **Categories → Apps**: One category has many apps
- **Apps → Packages**: One app can have multiple packages (one per source)
- **Sources → Packages**: One source provides many packages
- **Distros → DistroSources**: Many-to-many relationship defining available sources per distro
- **Users → Sessions**: One user can have multiple sessions
