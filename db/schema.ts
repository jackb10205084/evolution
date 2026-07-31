import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  avatarJson: text("avatar_json"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [uniqueIndex("users_email_uq").on(table.email)]);

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  builderName: text("builder_name").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  status: text("status", { enum: ["draft", "published", "archived"] }).notNull().default("draft"),
  settingsJson: text("settings_json").notNull().default("{}"),
  publishedVersion: integer("published_version").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("projects_tenant_slug_uq").on(table.tenantId, table.slug),
  index("projects_tenant_idx").on(table.tenantId),
]);

export const floorplans = sqliteTable("floorplans", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  name: text("name").notNull(),
  areaPing: integer("area_ping_x10").notNull(),
  assetVersion: text("asset_version").notNull(),
  manifestJson: text("manifest_json").notNull(),
  validationStatus: text("validation_status", { enum: ["pending", "passed", "failed"] }).notNull().default("pending"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [index("floorplans_project_idx").on(table.projectId)]);

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  sku: text("sku").notNull(),
  brandKind: text("brand_kind", { enum: ["owned", "affiliate"] }).notNull(),
  brand: text("brand").notNull(),
  name: text("name").notNull(),
  priceTwd: integer("price_twd").notNull(),
  stockStatus: text("stock_status").notNull(),
  cashbackRateBps: integer("cashback_rate_bps").notNull().default(0),
  assetVersion: text("asset_version").notNull(),
  metadataJson: text("metadata_json").notNull().default("{}"),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("products_tenant_sku_uq").on(table.tenantId, table.sku),
  index("products_tenant_idx").on(table.tenantId),
]);

export const designs = sqliteTable("designs", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  projectId: text("project_id").notNull(),
  floorplanId: text("floorplan_id").notNull(),
  ownerUserId: text("owner_user_id").notNull(),
  title: text("title").notNull().default("我的未來家"),
  themeId: text("theme_id").notNull(),
  snapshotVersion: integer("snapshot_version").notNull().default(1),
  snapshotJson: text("snapshot_json").notNull(),
  updatedAt: text("updated_at").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  uniqueIndex("design_owner_floorplan_uq").on(table.ownerUserId, table.projectId, table.floorplanId),
  index("designs_owner_idx").on(table.ownerUserId),
]);

export const bookings = sqliteTable("bookings", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  projectId: text("project_id").notNull(),
  userId: text("user_id").notNull(),
  designId: text("design_id"),
  floorplanId: text("floorplan_id").notNull(),
  scheduledAt: text("scheduled_at").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  status: text("status", { enum: ["pending", "confirmed", "checked_in", "cancelled"] }).notNull().default("pending"),
  consentVersion: text("consent_version").notNull(),
  consentedAt: text("consented_at").notNull(),
  sharedSummaryJson: text("shared_summary_json").notNull(),
  checkInTokenHash: text("check_in_token_hash").notNull(),
  checkedInAt: text("checked_in_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("bookings_project_time_idx").on(table.projectId, table.scheduledAt),
  index("bookings_user_idx").on(table.userId),
]);

export const renderLedger = sqliteTable("render_ledger", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  delta: integer("delta").notNull(),
  reason: text("reason", { enum: ["purchase", "check_in_grant", "render_charge", "render_refund", "admin_adjustment"] }).notNull(),
  referenceType: text("reference_type").notNull(),
  referenceId: text("reference_id").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  uniqueIndex("render_ledger_reason_reference_uq").on(table.userId, table.reason, table.referenceId),
  index("render_ledger_user_idx").on(table.userId),
]);

export const renderJobs = sqliteTable("render_jobs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  tenantId: text("tenant_id").notNull(),
  designId: text("design_id").notNull(),
  status: text("status", { enum: ["queued", "processing", "completed", "failed"] }).notNull().default("queued"),
  cameraJson: text("camera_json").notNull(),
  outputKey: text("output_key"),
  failureCode: text("failure_code"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [index("render_jobs_user_idx").on(table.userId)]);

export const shareLinks = sqliteTable("share_links", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id").notNull(),
  designId: text("design_id").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: text("expires_at"),
  revokedAt: text("revoked_at"),
  createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("share_links_token_uq").on(table.tokenHash)]);

export const affiliateClicks = sqliteTable("affiliate_clicks", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  userId: text("user_id"),
  productId: text("product_id").notNull(),
  campaignId: text("campaign_id").notNull(),
  destinationHost: text("destination_host").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [index("affiliate_click_product_idx").on(table.productId)]);

export const webhookDeliveries = sqliteTable("webhook_deliveries", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  eventType: text("event_type").notNull(),
  aggregateId: text("aggregate_id").notNull(),
  attempt: integer("attempt").notNull().default(0),
  status: text("status", { enum: ["pending", "delivered", "failed"] }).notNull().default("pending"),
  payloadJson: text("payload_json").notNull(),
  nextAttemptAt: text("next_attempt_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const idempotencyKeys = sqliteTable("idempotency_keys", {
  scope: text("scope").notNull(),
  key: text("key").notNull(),
  responseJson: text("response_json").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [uniqueIndex("idempotency_scope_key_uq").on(table.scope, table.key)]);

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  actorUserId: text("actor_user_id"),
  action: text("action").notNull(),
  aggregateType: text("aggregate_type").notNull(),
  aggregateId: text("aggregate_id").notNull(),
  metadataJson: text("metadata_json").notNull().default("{}"),
  createdAt: text("created_at").notNull(),
}, (table) => [index("audit_tenant_created_idx").on(table.tenantId, table.createdAt)]);
