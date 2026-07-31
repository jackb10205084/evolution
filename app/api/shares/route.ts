import { z } from "zod";
import { getDb } from "../../../db";
import { idempotencyKeys, shareLinks } from "../../../db/schema";
import { sha256 } from "../../lib/server-hash";
import { idempotencyRow, readIdempotentResponse, replayIdempotentResponse } from "../_idempotency";
import { apiError, currentUser, idempotencyKey } from "../_shared";

const createShare = z.object({
  designId: z.string().min(1).max(300),
  expiresInDays: z.number().int().min(1).max(90).default(30),
});

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return apiError("請先登入", 401);
  const requestKey = idempotencyKey(request);
  if (!requestKey) return apiError("需要 Idempotency-Key", 400);
  const scope = `share:create:${user.userId}`;
  const replay = await readIdempotentResponse(scope, requestKey);
  if (replay) return replayIdempotentResponse(replay);
  const parsed = createShare.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("分享設定格式不正確", 422, parsed.error.flatten());
  const token = crypto.randomUUID();
  const now = new Date();
  const id = `share:${requestKey}`;
  const expiresAt = new Date(now.getTime() + parsed.data.expiresInDays * 86_400_000).toISOString();
  const responseBody = { data: { id, token, expiresAt } };
  const db = getDb();
  await db.batch([
    db.insert(shareLinks).values({
    id,
    ownerUserId: user.userId,
    designId: parsed.data.designId,
    tokenHash: await sha256(token),
    expiresAt,
    revokedAt: null,
    createdAt: now.toISOString(),
    }).onConflictDoNothing({ target: shareLinks.id }),
    db.insert(idempotencyKeys).values(idempotencyRow(scope, requestKey, 201, responseBody))
      .onConflictDoNothing({ target: [idempotencyKeys.scope, idempotencyKeys.key] }),
  ]);
  return Response.json(responseBody, { status: 201 });
}
