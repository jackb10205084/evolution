import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { shareLinks } from "../../../../db/schema";
import { apiError, currentUser } from "../../_shared";

export async function DELETE(_request: Request, context: { params: Promise<{ shareId: string }> }) {
  const user = await currentUser();
  if (!user) return apiError("請先登入", 401);
  const { shareId } = await context.params;
  const db = getDb();
  const [link] = await db.select().from(shareLinks)
    .where(and(eq(shareLinks.id, shareId), eq(shareLinks.ownerUserId, user.userId)))
    .limit(1);
  if (!link) return apiError("找不到分享連結", 404);
  const revokedAt = link.revokedAt ?? new Date().toISOString();
  await db.update(shareLinks).set({ revokedAt })
    .where(and(eq(shareLinks.id, shareId), eq(shareLinks.ownerUserId, user.userId)));
  return Response.json({ data: { id: shareId, revokedAt } });
}
