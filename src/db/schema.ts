import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// Helper for timestamps
const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
};

// ============ AUTH TABLES (BetterAuth) ============

export const user = sqliteTable('user', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  name: text('name'),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  image: text('image'),
  role: text('role', { enum: ['user', 'admin', 'superadmin'] }).default('user'),
  ...timestamps,
});

export const session = sqliteTable('session', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  ...timestamps,
});

export const account = sqliteTable('account', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  ...timestamps,
});

export const verification = sqliteTable('verification', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ...timestamps,
});

// ============ APP TABLES ============

export const categories = sqliteTable('categories', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  icon: text('icon'),
  description: text('description'),
  displayOrder: integer('display_order').default(0),
  ...timestamps,
}, (table) => ({
  displayOrderIdx: index('categories_display_order_idx').on(table.displayOrder),
}));

export const apps = sqliteTable('apps', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  slug: text('slug').notNull().unique(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  iconUrl: text('icon_url'),
  homepage: text('homepage'),
  isPopular: integer('is_popular', { mode: 'boolean' }).default(false),
  isFoss: integer('is_foss', { mode: 'boolean' }).default(true),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id),
  ...timestamps,
}, (table) => ({
  categoryIdIdx: index('apps_category_id_idx').on(table.categoryId),
  isPopularIdx: index('apps_is_popular_idx').on(table.isPopular),
  categoryPopularIdx: index('apps_category_popular_idx').on(table.categoryId, table.isPopular),
}));

export const sources = sqliteTable('sources', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  installCmd: text('install_cmd').notNull(),
  requireSudo: integer('require_sudo', { mode: 'boolean' }).default(false),
  setupCmd: text('setup_cmd', { mode: 'json' }), // Supports both string (for universal commands) and object (for distro-family-specific commands)
  priority: integer('priority').default(0),
  apiEndpoint: text('api_endpoint'),
  ...timestamps,
});

export const packages = sqliteTable('packages', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  appId: text('app_id')
    .notNull()
    .references(() => apps.id, { onDelete: 'cascade' }),
  sourceId: text('source_id')
    .notNull()
    .references(() => sources.id),
  identifier: text('identifier').notNull(),
  version: text('version'),
  size: integer('size'),
  maintainer: text('maintainer'),
  isAvailable: integer('is_available', { mode: 'boolean' }).default(true),
  lastChecked: integer('last_checked', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  metadata: text('metadata', { mode: 'json' }),
  ...timestamps,
}, (table) => ({
  appIdIdx: index('packages_app_id_idx').on(table.appId),
  sourceIdIdx: index('packages_source_id_idx').on(table.sourceId),
  isAvailableIdx: index('packages_is_available_idx').on(table.isAvailable),
  appSourceIdx: index('packages_app_source_idx').on(table.appId, table.sourceId),
}));

export const distros = sqliteTable('distros', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  family: text('family').notNull(),
  iconUrl: text('icon_url'),
  basedOn: text('based_on'),
  isPopular: integer('is_popular', { mode: 'boolean' }).default(false),
  ...timestamps,
}, (table) => ({
  isPopularIdx: index('distros_is_popular_idx').on(table.isPopular),
  familyIdx: index('distros_family_idx').on(table.family),
}));

export const distroSources = sqliteTable('distro_sources', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  distroId: text('distro_id')
    .notNull()
    .references(() => distros.id, { onDelete: 'cascade' }),
  sourceId: text('source_id')
    .notNull()
    .references(() => sources.id, { onDelete: 'cascade' }),
  priority: integer('priority').default(0),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
}, (table) => ({
  distroIdIdx: index('distro_sources_distro_id_idx').on(table.distroId),
  sourceIdIdx: index('distro_sources_source_id_idx').on(table.sourceId),
  distroSourceIdx: index('distro_sources_distro_source_idx').on(table.distroId, table.sourceId),
}));

export const refreshLogs = sqliteTable('refresh_logs', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  sourceId: text('source_id'),
  status: text('status').notNull(),
  packagesUpdated: integer('packages_updated').default(0),
  errorMessage: text('error_message'),
  startedAt: integer('started_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
}, (table) => ({
  sourceIdIdx: index('refresh_logs_source_id_idx').on(table.sourceId),
  startedAtIdx: index('refresh_logs_started_at_idx').on(table.startedAt),
}));

// ============ COLLECTION TABLES ============

export const collections = sqliteTable('collections', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  slug: text('slug').notNull().unique(),
  iconUrl: text('icon_url'),
  isPublic: integer('is_public', { mode: 'boolean' }).default(false),
  isFeatured: integer('is_featured', { mode: 'boolean' }).default(false),
  isTemplate: integer('is_template', { mode: 'boolean' }).default(false),
  shareToken: text('share_token').unique(),
  viewCount: integer('view_count').default(0),
  installCount: integer('install_count').default(0),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  ...timestamps,
}, (table) => ({
  userIdIdx: index('collections_user_id_idx').on(table.userId),
  slugIdx: index('collections_slug_idx').on(table.slug),
  isPublicIdx: index('collections_is_public_idx').on(table.isPublic),
  isFeaturedIdx: index('collections_is_featured_idx').on(table.isFeatured),
  shareTokenIdx: index('collections_share_token_idx').on(table.shareToken),
}));

export const collectionItems = sqliteTable('collection_items', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  collectionId: text('collection_id')
    .notNull()
    .references(() => collections.id, { onDelete: 'cascade' }),
  appId: text('app_id')
    .notNull()
    .references(() => apps.id, { onDelete: 'cascade' }),
  displayOrder: integer('display_order').default(0),
  note: text('note'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => ({
  collectionIdIdx: index('collection_items_collection_id_idx').on(table.collectionId),
  appIdIdx: index('collection_items_app_id_idx').on(table.appId),
  collectionAppIdx: index('collection_items_collection_app_idx').on(table.collectionId, table.appId),
}));

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
  collectionItems: many(collectionItems),
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
  collections: many(collections),
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

export const refreshLogsRelations = relations(refreshLogs, ({ one }) => ({
  source: one(sources, {
    fields: [refreshLogs.sourceId],
    references: [sources.id],
  }),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  user: one(user, {
    fields: [collections.userId],
    references: [user.id],
  }),
  items: many(collectionItems),
}));

export const collectionItemsRelations = relations(collectionItems, ({ one }) => ({
  collection: one(collections, {
    fields: [collectionItems.collectionId],
    references: [collections.id],
  }),
  app: one(apps, {
    fields: [collectionItems.appId],
    references: [apps.id],
  }),
}));
