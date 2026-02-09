CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`tokens_used` integer,
	`model` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `chat_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `chat_messages_session_id_idx` ON `chat_messages` (`session_id`);--> statement-breakpoint
CREATE TABLE `chat_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor_id` text NOT NULL,
	`ip_hash` text NOT NULL,
	`user_agent` text,
	`message_count` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`last_active_at` text NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `chat_sessions_visitor_id_idx` ON `chat_sessions` (`visitor_id`);--> statement-breakpoint
CREATE INDEX `chat_sessions_ip_hash_idx` ON `chat_sessions` (`ip_hash`);--> statement-breakpoint
CREATE INDEX `chat_sessions_expires_at_idx` ON `chat_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `content` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`slug` text NOT NULL,
	`data` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
CREATE INDEX `content_type_idx` ON `content` (`type`);--> statement-breakpoint
CREATE UNIQUE INDEX `content_type_slug_idx` ON `content` (`type`,`slug`);--> statement-breakpoint
CREATE INDEX `content_deleted_at_idx` ON `content` (`deleted_at`);--> statement-breakpoint
CREATE TABLE `content_history` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`version` integer NOT NULL,
	`data` text NOT NULL,
	`change_type` text NOT NULL,
	`changed_by` text,
	`change_summary` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`content_id`) REFERENCES `content`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_history_version_idx` ON `content_history` (`content_id`,`version`);--> statement-breakpoint
CREATE INDEX `content_history_content_id_idx` ON `content_history` (`content_id`);--> statement-breakpoint
CREATE INDEX `content_history_change_type_idx` ON `content_history` (`change_type`);