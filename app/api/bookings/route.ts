import { z } from "zod";
import { getDb } from "../../../db";
import { bookings, webhookDeliveries } from "../../../db/schema";
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
  await getDb().insert(bookings).values(row).onConflictDoNothing({ target: bookings.id });
  await getDb().insert(webhookDeliveries).values({
    id: deliveryId,
    tenantId: alphaTenantId,
    eventType: "booking.created",
    aggregateId: id,
    payloadJson: JSON.stringify({ bookingId: id, projectId: alphaProjectId }),
    attempt: 0,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  }).onConflictDoNothing({ target: webhookDeliveries.id });

  return Response.json({ data: { id, status: "pending", checkInToken } }, { status: 201 });
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
