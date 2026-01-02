CREATE TABLE `collection_items` (
	`id` text PRIMARY KEY NOT NULL,
	`collection_id` text NOT NULL,
	`app_id` text NOT NULL,
	`display_order` integer DEFAULT 0,
	`note` text,
	`created_at` integer,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `collection_items_collection_id_idx` ON `collection_items` (`collection_id`);--> statement-breakpoint
CREATE INDEX `collection_items_app_id_idx` ON `collection_items` (`app_id`);--> statement-breakpoint
CREATE INDEX `collection_items_collection_app_idx` ON `collection_items` (`collection_id`,`app_id`);--> statement-breakpoint
CREATE TABLE `collection_likes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`collection_id` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`collection_id`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `collection_likes_user_id_idx` ON `collection_likes` (`user_id`);--> statement-breakpoint
CREATE INDEX `collection_likes_collection_id_idx` ON `collection_likes` (`collection_id`);--> statement-breakpoint
CREATE INDEX `collection_likes_user_collection_idx` ON `collection_likes` (`user_id`,`collection_id`);--> statement-breakpoint
CREATE TABLE `collections` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`slug` text NOT NULL,
	`icon_url` text,
	`is_public` integer DEFAULT false,
	`is_featured` integer DEFAULT false,
	`is_template` integer DEFAULT false,
	`share_token` text,
	`view_count` integer DEFAULT 0,
	`install_count` integer DEFAULT 0,
	`tags` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collections_slug_unique` ON `collections` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `collections_share_token_unique` ON `collections` (`share_token`);--> statement-breakpoint
CREATE INDEX `collections_user_id_idx` ON `collections` (`user_id`);--> statement-breakpoint
CREATE INDEX `collections_slug_idx` ON `collections` (`slug`);--> statement-breakpoint
CREATE INDEX `collections_is_public_idx` ON `collections` (`is_public`);--> statement-breakpoint
CREATE INDEX `collections_is_featured_idx` ON `collections` (`is_featured`);--> statement-breakpoint
CREATE INDEX `collections_share_token_idx` ON `collections` (`share_token`);--> statement-breakpoint
DROP INDEX "apps_slug_unique";--> statement-breakpoint
DROP INDEX "apps_category_id_idx";--> statement-breakpoint
DROP INDEX "apps_is_popular_idx";--> statement-breakpoint
DROP INDEX "apps_category_popular_idx";--> statement-breakpoint
DROP INDEX "categories_slug_unique";--> statement-breakpoint
DROP INDEX "categories_display_order_idx";--> statement-breakpoint
DROP INDEX "collection_items_collection_id_idx";--> statement-breakpoint
DROP INDEX "collection_items_app_id_idx";--> statement-breakpoint
DROP INDEX "collection_items_collection_app_idx";--> statement-breakpoint
DROP INDEX "collection_likes_user_id_idx";--> statement-breakpoint
DROP INDEX "collection_likes_collection_id_idx";--> statement-breakpoint
DROP INDEX "collection_likes_user_collection_idx";--> statement-breakpoint
DROP INDEX "collections_slug_unique";--> statement-breakpoint
DROP INDEX "collections_share_token_unique";--> statement-breakpoint
DROP INDEX "collections_user_id_idx";--> statement-breakpoint
DROP INDEX "collections_slug_idx";--> statement-breakpoint
DROP INDEX "collections_is_public_idx";--> statement-breakpoint
DROP INDEX "collections_is_featured_idx";--> statement-breakpoint
DROP INDEX "collections_share_token_idx";--> statement-breakpoint
DROP INDEX "distro_sources_distro_id_idx";--> statement-breakpoint
DROP INDEX "distro_sources_source_id_idx";--> statement-breakpoint
DROP INDEX "distro_sources_distro_source_idx";--> statement-breakpoint
DROP INDEX "distros_slug_unique";--> statement-breakpoint
DROP INDEX "distros_is_popular_idx";--> statement-breakpoint
DROP INDEX "distros_family_idx";--> statement-breakpoint
DROP INDEX "packages_app_id_idx";--> statement-breakpoint
DROP INDEX "packages_source_id_idx";--> statement-breakpoint
DROP INDEX "packages_is_available_idx";--> statement-breakpoint
DROP INDEX "packages_app_source_idx";--> statement-breakpoint
DROP INDEX "refresh_logs_source_id_idx";--> statement-breakpoint
DROP INDEX "refresh_logs_started_at_idx";--> statement-breakpoint
DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "sources_slug_unique";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
ALTER TABLE `user` ALTER COLUMN "role" TO "role" text DEFAULT 'user';--> statement-breakpoint
CREATE UNIQUE INDEX `apps_slug_unique` ON `apps` (`slug`);--> statement-breakpoint
CREATE INDEX `apps_category_id_idx` ON `apps` (`category_id`);--> statement-breakpoint
CREATE INDEX `apps_is_popular_idx` ON `apps` (`is_popular`);--> statement-breakpoint
CREATE INDEX `apps_category_popular_idx` ON `apps` (`category_id`,`is_popular`);--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE INDEX `categories_display_order_idx` ON `categories` (`display_order`);--> statement-breakpoint
CREATE INDEX `distro_sources_distro_id_idx` ON `distro_sources` (`distro_id`);--> statement-breakpoint
CREATE INDEX `distro_sources_source_id_idx` ON `distro_sources` (`source_id`);--> statement-breakpoint
CREATE INDEX `distro_sources_distro_source_idx` ON `distro_sources` (`distro_id`,`source_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `distros_slug_unique` ON `distros` (`slug`);--> statement-breakpoint
CREATE INDEX `distros_is_popular_idx` ON `distros` (`is_popular`);--> statement-breakpoint
CREATE INDEX `distros_family_idx` ON `distros` (`family`);--> statement-breakpoint
CREATE INDEX `packages_app_id_idx` ON `packages` (`app_id`);--> statement-breakpoint
CREATE INDEX `packages_source_id_idx` ON `packages` (`source_id`);--> statement-breakpoint
CREATE INDEX `packages_is_available_idx` ON `packages` (`is_available`);--> statement-breakpoint
CREATE INDEX `packages_app_source_idx` ON `packages` (`app_id`,`source_id`);--> statement-breakpoint
CREATE INDEX `refresh_logs_source_id_idx` ON `refresh_logs` (`source_id`);--> statement-breakpoint
CREATE INDEX `refresh_logs_started_at_idx` ON `refresh_logs` (`started_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `sources_slug_unique` ON `sources` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);