import { z } from "zod";
import { getDb } from "../../../db";
import { shareLinks } from "../../../db/schema";
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
  const parsed = createShare.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("分享設定格式不正確", 422, parsed.error.flatten());
  const token = crypto.randomUUID();
  const now = new Date();
  const id = `share:${requestKey}`;
  await getDb().insert(shareLinks).values({
    id,
    ownerUserId: user.userId,
    designId: parsed.data.designId,
    tokenHash: await sha256(token),
    expiresAt: new Date(now.getTime() + parsed.data.expiresInDays * 86_400_000).toISOString(),
    revokedAt: null,
    createdAt: now.toISOString(),
  }).onConflictDoNothing({ target: shareLinks.id });
  return Response.json({ data: { id, token, expiresAt: new Date(now.getTime() + parsed.data.expiresInDays * 86_400_000).toISOString() } }, { status: 201 });
}

async function sha256(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
