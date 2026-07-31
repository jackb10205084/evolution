import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../../../db";
import { bookings, idempotencyKeys, webhookDeliveries } from "../../../db/schema";
import { sha256 } from "../../lib/server-hash";
import { idempotencyRow, readIdempotentResponse, replayIdempotentResponse } from "../_idempotency";
import { alphaProjectId, alphaTenantId, apiError, currentUser, idempotencyKey } from "../_shared";

const createBooking = z.object({
  floorplanId: z.string().min(1).max(100),
  designId: z.string().max(300).optional(),
  scheduledAt: z.string().datetime(),
  name: z.string().min(2).max(80),
  phone: z.string().min(8).max(30),
  consent: z.literal(true),
  configurationSummary: z.record(z.string(), z.unknown()),
});

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return apiError("請先登入", 401);
  const requestKey = idempotencyKey(request);
  if (!requestKey) return apiError("需要 Idempotency-Key", 400);
  const scope = `booking:create:${user.userId}`;
  const replay = await readIdempotentResponse(scope, requestKey);
  if (replay) return replayIdempotentResponse(replay);
  const parsed = createBooking.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("預約資料格式不正確", 422, parsed.error.flatten());

  const now = new Date().toISOString();
  const id = `booking:${requestKey}`;
  const deliveryId = `webhook:booking.created:${id}`;
  const checkInToken = crypto.randomUUID();
  const tokenHash = await sha256(checkInToken);
  const row = {
    id,
    tenantId: alphaTenantId,
    projectId: alphaProjectId,
    userId: user.userId,
    designId: parsed.data.designId ?? null,
    floorplanId: parsed.data.floorplanId,
    scheduledAt: parsed.data.scheduledAt,
    name: parsed.data.name,
    phone: parsed.data.phone,
    status: "pending" as const,
    consentVersion: "booking-share-v1",
    consentedAt: now,
    sharedSummaryJson: JSON.stringify(parsed.data.configurationSummary),
    checkInTokenHash: tokenHash,
    checkedInAt: null,
    createdAt: now,
    updatedAt: now,
  };
  const responseBody = { data: { id, status: "pending", checkInToken, scheduledAt: parsed.data.scheduledAt } };
  const db = getDb();
  await db.batch([
    db.insert(bookings).values(row).onConflictDoNothing({ target: bookings.id }),
    db.insert(webhookDeliveries).values({
    id: deliveryId,
    tenantId: alphaTenantId,
    eventType: "booking.created",
    aggregateId: id,
    payloadJson: JSON.stringify({ bookingId: id, projectId: alphaProjectId }),
    attempt: 0,
    status: "pending",
    createdAt: now,
    updatedAt: now,
    }).onConflictDoNothing({ target: webhookDeliveries.id }),
    db.insert(idempotencyKeys).values(idempotencyRow(scope, requestKey, 201, responseBody))
      .onConflictDoNothing({ target: [idempotencyKeys.scope, idempotencyKeys.key] }),
  ]);

  return Response.json(responseBody, { status: 201 });
}

export async function GET() {
  const user = await currentUser();
  if (!user) return apiError("請先登入", 401);
  const rows = await getDb().select({
    id: bookings.id,
    floorplanId: bookings.floorplanId,
    scheduledAt: bookings.scheduledAt,
    status: bookings.status,
    consentedAt: bookings.consentedAt,
    checkedInAt: bookings.checkedInAt,
    sharedSummaryJson: bookings.sharedSummaryJson,
  }).from(bookings).where(eq(bookings.userId, user.userId)).orderBy(desc(bookings.createdAt));
  return Response.json({ data: rows.map((row) => ({
    ...row,
    configurationSummary: JSON.parse(row.sharedSummaryJson),
    sharedSummaryJson: undefined,
  })) });
}
