import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../../../../../db";
import { renderJobs, renderLedger } from "../../../../../db/schema";
import { apiError } from "../../../_shared";

const workerResult = z.discriminatedUnion("status", [
  z.object({ status: z.literal("completed"), outputKey: z.string().min(1).max(500) }),
  z.object({ status: z.literal("failed"), failureCode: z.string().min(1).max(100) }),
]);

export async function POST(request: Request, context: { params: Promise<{ renderId: string }> }) {
  if (!env.RENDER_WORKER_SECRET) return apiError("渲染 Worker 尚未設定", 503);
  if (request.headers.get("authorization") !== `Bearer ${env.RENDER_WORKER_SECRET}`) {
    return apiError("未授權的渲染 Worker", 401);
  }
  const parsed = workerResult.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("Worker 回報格式不正確", 422, parsed.error.flatten());
  const { renderId } = await context.params;
  const db = getDb();
  const [job] = await db.select().from(renderJobs).where(eq(renderJobs.id, renderId)).limit(1);
  if (!job) return apiError("找不到渲染任務", 404);
  const now = new Date().toISOString();

  if (parsed.data.status === "completed") {
    await db.update(renderJobs).set({
      status: "completed",
      outputKey: parsed.data.outputKey,
      failureCode: null,
      updatedAt: now,
    }).where(eq(renderJobs.id, renderId));
    return Response.json({ data: { id: renderId, status: "completed" } });
  }

  await db.batch([
    db.update(renderJobs).set({
      status: "failed",
      failureCode: parsed.data.failureCode,
      updatedAt: now,
    }).where(eq(renderJobs.id, renderId)),
    db.insert(renderLedger).values({
      id: `ledger:render-refund:${renderId}`,
      userId: job.userId,
      delta: 1,
      reason: "render_refund",
      referenceType: "render_job",
      referenceId: renderId,
      createdAt: now,
    }).onConflictDoNothing({ target: [renderLedger.userId, renderLedger.reason, renderLedger.referenceId] }),
  ]);
  return Response.json({ data: { id: renderId, status: "failed", creditsRefunded: 1 } });
}
