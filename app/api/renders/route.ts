import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../../../db";
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
  await db.insert(renderLedger).values({
    id: `ledger:render:${id}`,
    userId: user.userId,
    delta: -1,
    reason: "render_charge",
    referenceType: "render_job",
    referenceId: id,
    createdAt: now,
  }).onConflictDoNothing({ target: [renderLedger.userId, renderLedger.reason, renderLedger.referenceId] });
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
  await db.insert(renderJobs).values(job).onConflictDoNothing({ target: renderJobs.id });
  return Response.json({ data: job }, { status: 202 });
}
