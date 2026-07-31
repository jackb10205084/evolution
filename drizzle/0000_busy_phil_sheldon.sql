CREATE TABLE `affiliate_clicks` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`user_id` text,
	`product_id` text NOT NULL,
	`campaign_id` text NOT NULL,
	`destination_host` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `affiliate_click_product_idx` ON `affiliate_clicks` (`product_id`);--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`actor_user_id` text,
	`action` text NOT NULL,
	`aggregate_type` text NOT NULL,
	`aggregate_id` text NOT NULL,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_tenant_created_idx` ON `audit_events` (`tenant_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`project_id` text NOT NULL,
	`user_id` text NOT NULL,
	`design_id` text,
	`floorplan_id` text NOT NULL,
	`scheduled_at` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`consent_version` text NOT NULL,
	`consented_at` text NOT NULL,
	`shared_summary_json` text NOT NULL,
	`check_in_token_hash` text NOT NULL,
	`checked_in_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `bookings_project_time_idx` ON `bookings` (`project_id`,`scheduled_at`);--> statement-breakpoint
CREATE INDEX `bookings_user_idx` ON `bookings` (`user_id`);--> statement-breakpoint
CREATE TABLE `designs` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`project_id` text NOT NULL,
	`floorplan_id` text NOT NULL,
	`owner_user_id` text NOT NULL,
	`title` text DEFAULT '我的未來家' NOT NULL,
	`theme_id` text NOT NULL,
	`snapshot_version` integer DEFAULT 1 NOT NULL,
	`snapshot_json` text NOT NULL,
	`updated_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `design_owner_floorplan_uq` ON `designs` (`owner_user_id`,`project_id`,`floorplan_id`);--> statement-breakpoint
CREATE INDEX `designs_owner_idx` ON `designs` (`owner_user_id`);--> statement-breakpoint
CREATE TABLE `floorplans` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`area_ping_x10` integer NOT NULL,
	`asset_version` text NOT NULL,
	`manifest_json` text NOT NULL,
	`validation_status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `floorplans_project_idx` ON `floorplans` (`project_id`);--> statement-breakpoint
CREATE TABLE `idempotency_keys` (
	`scope` text NOT NULL,
	`key` text NOT NULL,
	`response_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idempotency_scope_key_uq` ON `idempotency_keys` (`scope`,`key`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`sku` text NOT NULL,
	`brand_kind` text NOT NULL,
	`brand` text NOT NULL,
	`name` text NOT NULL,
	`price_twd` integer NOT NULL,
	`stock_status` text NOT NULL,
	`cashback_rate_bps` integer DEFAULT 0 NOT NULL,
	`asset_version` text NOT NULL,
	`metadata_json` text DEFAULT '{}' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_tenant_sku_uq` ON `products` (`tenant_id`,`sku`);--> statement-breakpoint
CREATE INDEX `products_tenant_idx` ON `products` (`tenant_id`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`builder_name` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`settings_json` text DEFAULT '{}' NOT NULL,
	`published_version` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_tenant_slug_uq` ON `projects` (`tenant_id`,`slug`);--> statement-breakpoint
CREATE INDEX `projects_tenant_idx` ON `projects` (`tenant_id`);--> statement-breakpoint
CREATE TABLE `render_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`tenant_id` text NOT NULL,
	`design_id` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`camera_json` text NOT NULL,
	`output_key` text,
	`failure_code` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `render_jobs_user_idx` ON `render_jobs` (`user_id`);--> statement-breakpoint
CREATE TABLE `render_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`delta` integer NOT NULL,
	`reason` text NOT NULL,
	`reference_type` text NOT NULL,
	`reference_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `render_ledger_reason_reference_uq` ON `render_ledger` (`user_id`,`reason`,`reference_id`);--> statement-breakpoint
CREATE INDEX `render_ledger_user_idx` ON `render_ledger` (`user_id`);--> statement-breakpoint
CREATE TABLE `share_links` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`design_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text,
	`revoked_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `share_links_token_uq` ON `share_links` (`token_hash`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`avatar_json` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_uq` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `webhook_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`event_type` text NOT NULL,
	`aggregate_id` text NOT NULL,
	`attempt` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`payload_json` text NOT NULL,
	`next_attempt_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
