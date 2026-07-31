import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getD1, getDb } from "../../../db";
import { renderJobs, renderLedger } from "../../../db/schema";
import { alphaTenantId, apiError, currentUser, idempotencyKey } from "../_shared";

const submitRender = z.object({
  designId: z.string().min(1).max(300),
  camera: z.object({
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
    target: z.object({ x: z.number(), y: z.number(), z: z.number() }),
    fov: z.number().min(15).max(100),
  }),
});

export async function GET() {
  const user = await currentUser();
  if (!user) return apiError("請先登入", 401);
  const db = getDb();
  const [jobs, ledger] = await Promise.all([
    db.select().from(renderJobs).where(eq(renderJobs.userId, user.userId)).orderBy(desc(renderJobs.createdAt)),
    db.select().from(renderLedger).where(eq(renderLedger.userId, user.userId)),
  ]);
  return Response.json({ data: { jobs, balance: ledger.reduce((sum, entry) => sum + entry.delta, 0) } });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return apiError("請先登入", 401);
  const requestKey = idempotencyKey(request);
  if (!requestKey) return apiError("需要 Idempotency-Key", 400);
  const parsed = submitRender.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("渲染資料格式不正確", 422, parsed.error.flatten());
  const db = getDb();
  const id = `render:${requestKey}`;
  const [existing] = await db.select().from(renderJobs).where(eq(renderJobs.id, id)).limit(1);
  if (existing) return Response.json({ data: existing });

  const ledger = await db.select().from(renderLedger).where(eq(renderLedger.userId, user.userId));
  if (ledger.reduce((sum, entry) => sum + entry.delta, 0) < 1) return apiError("渲染點數不足", 402);
  const now = new Date().toISOString();
  let chargeResult: D1Result;
  try {
    chargeResult = await getD1().prepare(`
      INSERT INTO render_ledger
        (id, user_id, delta, reason, reference_type, reference_id, created_at)
      SELECT ?, ?, -1, 'render_charge', 'render_job', ?, ?
      WHERE (
        SELECT COALESCE(SUM(delta), 0)
        FROM render_ledger
        WHERE user_id = ?
      ) >= 1
    `).bind(`ledger:render:${id}`, user.userId, id, now, user.userId).run();
  } catch {
    const [racedJob] = await db.select().from(renderJobs).where(eq(renderJobs.id, id)).limit(1);
    if (racedJob) return Response.json({ data: racedJob, idempotentReplay: true });
    return apiError("渲染任務建立衝突，請重試", 409);
  }
  if (chargeResult.meta.changes !== 1) return apiError("渲染點數不足", 402);
  const job = {
    id,
    userId: user.userId,
    tenantId: alphaTenantId,
    designId: parsed.data.designId,
    status: "queued" as const,
    cameraJson: JSON.stringify(parsed.data.camera),
    outputKey: null,
    failureCode: null,
    createdAt: now,
    updatedAt: now,
  };
  try {
    await db.insert(renderJobs).values(job);
  } catch {
    await db.insert(renderLedger).values({
      id: `ledger:render-refund:${id}`,
      userId: user.userId,
      delta: 1,
      reason: "render_refund",
      referenceType: "render_job",
      referenceId: id,
      createdAt: new Date().toISOString(),
    }).onConflictDoNothing({ target: [renderLedger.userId, renderLedger.reason, renderLedger.referenceId] });
    return apiError("任務未建立，點數已退還", 500);
  }
  return Response.json({ data: job }, { status: 202 });
}
