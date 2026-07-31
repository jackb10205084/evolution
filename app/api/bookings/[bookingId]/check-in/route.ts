import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../../../../../db";
import { bookings, renderLedger, webhookDeliveries } from "../../../../../db/schema";
import { alphaTenantId, apiError, currentUser, idempotencyKey } from "../../../_shared";

const checkInBody = z.object({ token: z.string().uuid() });

export async function POST(request: Request, context: { params: Promise<{ bookingId: string }> }) {
  const actor = await currentUser();
  if (!actor) return apiError("請先登入", 401);
  if (!idempotencyKey(request)) return apiError("需要 Idempotency-Key", 400);
  const parsed = checkInBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("報到資料格式不正確", 422);
  const { bookingId } = await context.params;
  const db = getDb();
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!booking) return apiError("找不到此預約", 404);
  if (booking.checkInTokenHash !== await sha256(parsed.data.token)) return apiError("報到碼無效", 403);

  if (booking.checkedInAt) {
    return Response.json({ data: { bookingId, status: "checked_in", creditsGranted: 0, alreadyProcessed: true } });
  }

  const now = new Date().toISOString();
  await db.update(bookings).set({ status: "checked_in", checkedInAt: now, updatedAt: now })
    .where(and(eq(bookings.id, bookingId), isNull(bookings.checkedInAt)));
  await db.insert(renderLedger).values({
    id: `ledger:check-in:${bookingId}`,
    userId: booking.userId,
    delta: 3,
    reason: "check_in_grant",
    referenceType: "booking",
    referenceId: bookingId,
    createdAt: now,
  }).onConflictDoNothing({ target: [renderLedger.userId, renderLedger.reason, renderLedger.referenceId] });
  await db.insert(webhookDeliveries).values({
    id: `webhook:booking.checked_in:${bookingId}`,
    tenantId: alphaTenantId,
    eventType: "booking.checked_in",
    aggregateId: bookingId,
    payloadJson: JSON.stringify({ bookingId, checkedInAt: now }),
    status: "pending",
    attempt: 0,
    createdAt: now,
    updatedAt: now,
  }).onConflictDoNothing({ target: webhookDeliveries.id });

  return Response.json({ data: { bookingId, status: "checked_in", creditsGranted: 3, alreadyProcessed: false } });
}

async function sha256(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
