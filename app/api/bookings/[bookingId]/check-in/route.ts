import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../../../../../db";
import { bookings, idempotencyKeys, renderLedger, webhookDeliveries } from "../../../../../db/schema";
import { sha256 } from "../../../../lib/server-hash";
import { idempotencyRow, readIdempotentResponse, replayIdempotentResponse } from "../../../_idempotency";
import { alphaTenantId, apiError, currentUser, idempotencyKey } from "../../../_shared";

const checkInBody = z.object({ token: z.string().uuid() });

export async function POST(request: Request, context: { params: Promise<{ bookingId: string }> }) {
  const actor = await currentUser();
  if (!actor) return apiError("請先登入", 401);
  const requestKey = idempotencyKey(request);
  if (!requestKey) return apiError("需要 Idempotency-Key", 400);
  const parsed = checkInBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("報到資料格式不正確", 422);
  const { bookingId } = await context.params;
  const scope = `booking:check-in:${bookingId}`;
  const replay = await readIdempotentResponse(scope, requestKey);
  if (replay) return replayIdempotentResponse(replay);
  const db = getDb();
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!booking) return apiError("找不到此預約", 404);
  if (booking.checkInTokenHash !== await sha256(parsed.data.token)) return apiError("報到碼無效", 403);

  if (booking.checkedInAt) {
    const body = { data: { bookingId, status: "checked_in", creditsGranted: 0, alreadyProcessed: true } };
    await db.insert(idempotencyKeys).values(idempotencyRow(scope, requestKey, 200, body))
      .onConflictDoNothing({ target: [idempotencyKeys.scope, idempotencyKeys.key] });
    return Response.json(body);
  }

  const now = new Date().toISOString();
  const body = { data: { bookingId, status: "checked_in", creditsGranted: 3, alreadyProcessed: false } };
  await db.batch([
    db.update(bookings).set({ status: "checked_in", checkedInAt: now, updatedAt: now })
      .where(and(eq(bookings.id, bookingId), isNull(bookings.checkedInAt))),
    db.insert(renderLedger).values({
      id: `ledger:check-in:${bookingId}`,
      userId: booking.userId,
      delta: 3,
      reason: "check_in_grant",
      referenceType: "booking",
      referenceId: bookingId,
      createdAt: now,
    }).onConflictDoNothing({ target: [renderLedger.userId, renderLedger.reason, renderLedger.referenceId] }),
    db.insert(webhookDeliveries).values({
      id: `webhook:booking.checked_in:${bookingId}`,
      tenantId: alphaTenantId,
      eventType: "booking.checked_in",
      aggregateId: bookingId,
      payloadJson: JSON.stringify({ bookingId, checkedInAt: now }),
      status: "pending",
      attempt: 0,
      createdAt: now,
      updatedAt: now,
    }).onConflictDoNothing({ target: webhookDeliveries.id }),
    db.insert(idempotencyKeys).values(idempotencyRow(scope, requestKey, 200, body))
      .onConflictDoNothing({ target: [idempotencyKeys.scope, idempotencyKeys.key] }),
  ]);

  return Response.json(body);
}
