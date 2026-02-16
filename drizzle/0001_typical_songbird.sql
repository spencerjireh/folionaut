DROP INDEX `content_history_version_idx`;--> statement-breakpoint
CREATE INDEX `content_history_version_idx` ON `content_history` (`content_id`,`version`);