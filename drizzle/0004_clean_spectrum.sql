ALTER TABLE `categories` ADD `color_light` text;--> statement-breakpoint
ALTER TABLE `categories` ADD `color_dark` text;--> statement-breakpoint
ALTER TABLE `distros` ADD `theme_color_light` text;--> statement-breakpoint
ALTER TABLE `distros` ADD `theme_color_dark` text;--> statement-breakpoint
ALTER TABLE `packages` ADD `package_setup_cmd` text;