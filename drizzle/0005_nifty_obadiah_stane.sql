CREATE TABLE `installations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`app_id` text NOT NULL,
	`package_id` text NOT NULL,
	`distro_id` text NOT NULL,
	`device_identifier` text NOT NULL,
	`installed_at` integer,
	`notes` text,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`app_id`) REFERENCES `apps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`package_id`) REFERENCES `packages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`distro_id`) REFERENCES `distros`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `installations_user_id_idx` ON `installations` (`user_id`);--> statement-breakpoint
CREATE INDEX `installations_app_id_idx` ON `installations` (`app_id`);--> statement-breakpoint
CREATE INDEX `installations_device_idx` ON `installations` (`user_id`,`device_identifier`);--> statement-breakpoint
CREATE INDEX `installations_user_app_device_idx` ON `installations` (`user_id`,`app_id`,`device_identifier`);--> statement-breakpoint
ALTER TABLE `packages` ADD `package_cleanup_cmd` text;--> statement-breakpoint
ALTER TABLE `packages` ADD `uninstall_metadata` text;--> statement-breakpoint
ALTER TABLE `sources` ADD `remove_cmd` text;--> statement-breakpoint
ALTER TABLE `sources` ADD `cleanup_cmd` text;--> statement-breakpoint
ALTER TABLE `sources` ADD `supports_dependency_cleanup` integer DEFAULT false;--> statement-breakpoint
ALTER TABLE `sources` ADD `dependency_cleanup_cmd` text;