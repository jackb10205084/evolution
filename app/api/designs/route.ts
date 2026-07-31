import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../../../db";
import { designs } from "../../../db/schema";
import { alphaProjectId, alphaTenantId, apiError, currentUser } from "../_shared";

const vector = z.object({ x: z.number().finite(), y: z.number().finite(), z: z.number().finite() });
const quaternion = vector.extend({ w: z.number().finite() });
const sceneObject = z.object({
  id: z.string().min(1).max(120),
  sku: z.string().min(1).max(120),
  assetVersion: z.string().min(1).max(80),
  position: vector,
  rotation: quaternion,
  materialVariant: z.number().int().min(0).max(99),
});
const saveDesign = z.object({
  floorplanId: z.string().min(1).max(100),
  themeId: z.string().min(1).max(100),
  objects: z.array(sceneObject).max(500),
});

export async function GET() {
  const user = await currentUser();
  if (!user) return apiError("請先登入", 401);
  const rows = await getDb().select().from(designs).where(eq(designs.ownerUserId, user.userId));
  return Response.json({ data: rows.map((row) => ({ ...row, snapshot: JSON.parse(row.snapshotJson) })) });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return apiError("請先登入", 401);
  const parsed = saveDesign.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("場景快照格式不正確", 422, parsed.error.flatten());

  const now = new Date().toISOString();
  const id = `design:${user.userId}:${alphaProjectId}:${parsed.data.floorplanId}`;
  const snapshot = {
    schemaVersion: "1.0",
    unit: "meter",
    projectId: alphaProjectId,
    floorplanId: parsed.data.floorplanId,
    themeId: parsed.data.themeId,
    objects: parsed.data.objects,
    camera: { position: { x: 8, y: 7.5, z: 9 }, target: { x: 0, y: 0, z: 0 }, fov: 44 },
    savedAt: now,
  };

  await getDb().insert(designs).values({
    id,
    tenantId: alphaTenantId,
    projectId: alphaProjectId,
    floorplanId: parsed.data.floorplanId,
    ownerUserId: user.userId,
    title: "我的未來家",
    themeId: parsed.data.themeId,
    snapshotVersion: 1,
    snapshotJson: JSON.stringify(snapshot),
    createdAt: now,
    updatedAt: now,
  }).onConflictDoUpdate({
    target: [designs.ownerUserId, designs.projectId, designs.floorplanId],
    set: { themeId: parsed.data.themeId, snapshotJson: JSON.stringify(snapshot), updatedAt: now },
  });

  return Response.json({ data: { id, snapshotVersion: 1, savedAt: now } });
}
