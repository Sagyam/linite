CREATE INDEX `apps_category_id_idx` ON `apps` (`category_id`);--> statement-breakpoint
CREATE INDEX `apps_is_popular_idx` ON `apps` (`is_popular`);--> statement-breakpoint
CREATE INDEX `apps_category_popular_idx` ON `apps` (`category_id`,`is_popular`);--> statement-breakpoint
CREATE INDEX `categories_display_order_idx` ON `categories` (`display_order`);--> statement-breakpoint
CREATE INDEX `distro_sources_distro_id_idx` ON `distro_sources` (`distro_id`);--> statement-breakpoint
CREATE INDEX `distro_sources_source_id_idx` ON `distro_sources` (`source_id`);--> statement-breakpoint
CREATE INDEX `distro_sources_distro_source_idx` ON `distro_sources` (`distro_id`,`source_id`);--> statement-breakpoint
CREATE INDEX `distros_is_popular_idx` ON `distros` (`is_popular`);--> statement-breakpoint
CREATE INDEX `distros_family_idx` ON `distros` (`family`);--> statement-breakpoint
CREATE INDEX `packages_app_id_idx` ON `packages` (`app_id`);--> statement-breakpoint
CREATE INDEX `packages_source_id_idx` ON `packages` (`source_id`);--> statement-breakpoint
CREATE INDEX `packages_is_available_idx` ON `packages` (`is_available`);--> statement-breakpoint
CREATE INDEX `packages_app_source_idx` ON `packages` (`app_id`,`source_id`);--> statement-breakpoint
CREATE INDEX `refresh_logs_source_id_idx` ON `refresh_logs` (`source_id`);--> statement-breakpoint
CREATE INDEX `refresh_logs_started_at_idx` ON `refresh_logs` (`started_at`);