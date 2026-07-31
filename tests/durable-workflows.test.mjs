import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Miniflare } from "miniflare";
import test from "node:test";

const serverRoot = fileURLToPath(new URL("../dist/server/", import.meta.url));
const migrationPath = new URL("../drizzle/0000_busy_phil_sheldon.sql", import.meta.url);
const authHeaders = {
  "oai-authenticated-user-id": "workflow-test-user",
  "oai-authenticated-user-email": "workflow@example.test",
};

let mf;
let d1;

test.before(async () => {
  const serverFiles = await readdir(serverRoot, { recursive: true });
  const modules = ["index.js", ...serverFiles
    .filter((path) => path.endsWith(".js") && path !== "index.js")
    .sort()]
    .map((path) => ({ type: "ESModule", path: join(serverRoot, path) }));
  mf = new Miniflare({
    modules,
    modulesRoot: serverRoot,
    compatibilityDate: "2026-05-22",
    compatibilityFlags: ["nodejs_compat"],
    d1Databases: ["DB"],
    bindings: { RENDER_WORKER_SECRET: "test-render-secret" },
    serviceBindings: { ASSETS: async () => new Response("Not found", { status: 404 }) },
  });
  d1 = await mf.getD1Database("DB");
  const migration = await readFile(migrationPath, "utf8");
  const statements = migration.split("--> statement-breakpoint").map((statement) => statement.trim()).filter(Boolean);
  await d1.batch(statements.map((statement) => d1.prepare(statement)));
});

test.after(async () => {
  await mf?.dispose();
});

function api(path, { method = "GET", body, key, headers = {} } = {}) {
  return mf.dispatchFetch(`http://homeplay.test${path}`, {
    method,
    headers: {
      ...authHeaders,
      ...(body ? { "content-type": "application/json" } : {}),
      ...(key ? { "idempotency-key": key } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

test("persists scene snapshots and reloads the same schema", async () => {
  const object = {
    id: "scene-test-sofa",
    sku: "PG-SF-001",
    assetVersion: "1.2.0",
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    materialVariant: 0,
  };
  const save = await api("/api/designs", { method: "POST", body: { floorplanId: "two-room-21", themeId: "sunny", objects: [object] } });
  assert.equal(save.status, 200);
  const saved = await save.json();
  assert.match(saved.data.id, /^design:/);

  const load = await api("/api/designs");
  assert.equal(load.status, 200);
  const loaded = await load.json();
  assert.equal(loaded.data.length, 1);
  assert.equal(loaded.data[0].snapshot.schemaVersion, "1.0");
  assert.deepEqual(loaded.data[0].snapshot.objects, [object]);
});

test("keeps booking, check-in, render charges, refunds and shares idempotent", async () => {
  const bookingKey = "booking-workflow-001";
  const bookingBody = {
    floorplanId: "two-room-21",
    scheduledAt: "2026-08-08T06:00:00.000Z",
    name: "陳小居",
    phone: "0912345678",
    consent: true,
    configurationSummary: { themeId: "sunny", furnitureCount: 1 },
  };
  const firstBookingResponse = await api("/api/bookings", { method: "POST", key: bookingKey, body: bookingBody });
  assert.equal(firstBookingResponse.status, 201);
  const firstBooking = await firstBookingResponse.json();
  const replayBookingResponse = await api("/api/bookings", { method: "POST", key: bookingKey, body: bookingBody });
  assert.equal(replayBookingResponse.headers.get("x-idempotent-replay"), "true");
  const replayBooking = await replayBookingResponse.json();
  assert.equal(replayBooking.data.checkInToken, firstBooking.data.checkInToken);

  const bookingPath = `/api/bookings/${encodeURIComponent(firstBooking.data.id)}/check-in`;
  const checkInResponse = await api(bookingPath, { method: "POST", key: "checkin-001", body: { token: firstBooking.data.checkInToken } });
  assert.equal(checkInResponse.status, 200);
  assert.equal((await checkInResponse.json()).data.creditsGranted, 3);
  const secondCheckIn = await api(bookingPath, { method: "POST", key: "checkin-002", body: { token: firstBooking.data.checkInToken } });
  assert.equal((await secondCheckIn.json()).data.creditsGranted, 0);

  let state = await (await api("/api/renders")).json();
  assert.equal(state.data.balance, 3);
  const renderIds = [];
  for (let index = 0; index < 3; index += 1) {
    const key = `render-${index}`;
    const renderResponse = await api("/api/renders", {
      method: "POST",
      key,
      body: {
        designId: "design:workflow-test-user:project-farglory-le-yuan:two-room-21",
        camera: { position: { x: 8, y: 7, z: 9 }, target: { x: 0, y: 0, z: 0 }, fov: 38 },
      },
    });
    assert.equal(renderResponse.status, 202);
    renderIds.push((await renderResponse.json()).data.id);
  }
  const insufficient = await api("/api/renders", {
    method: "POST",
    key: "render-no-credit",
    body: {
      designId: "design:workflow-test-user:project-farglory-le-yuan:two-room-21",
      camera: { position: { x: 8, y: 7, z: 9 }, target: { x: 0, y: 0, z: 0 }, fov: 38 },
    },
  });
  assert.equal(insufficient.status, 402);
  state = await (await api("/api/renders")).json();
  assert.equal(state.data.balance, 0);

  const failWorker = await api(`/api/internal/renders/${encodeURIComponent(renderIds[0])}`, {
    method: "POST",
    headers: { authorization: "Bearer test-render-secret" },
    body: { status: "failed", failureCode: "ALPHA_WORKER_FAILURE" },
  });
  assert.equal(failWorker.status, 200);
  await api(`/api/internal/renders/${encodeURIComponent(renderIds[0])}`, {
    method: "POST",
    headers: { authorization: "Bearer test-render-secret" },
    body: { status: "failed", failureCode: "ALPHA_WORKER_FAILURE" },
  });
  state = await (await api("/api/renders")).json();
  assert.equal(state.data.balance, 1);

  const shareKey = "share-workflow-001";
  const shareResponse = await api("/api/shares", { method: "POST", key: shareKey, body: { designId: "design:workflow-test-user:project-farglory-le-yuan:two-room-21", expiresInDays: 30 } });
  assert.equal(shareResponse.status, 201);
  const share = await shareResponse.json();
  const shareReplay = await api("/api/shares", { method: "POST", key: shareKey, body: { designId: "design:workflow-test-user:project-farglory-le-yuan:two-room-21", expiresInDays: 30 } });
  assert.equal((await shareReplay.json()).data.token, share.data.token);

  const sharedPage = await mf.dispatchFetch(`http://homeplay.test/s/${share.data.token}`);
  assert.equal(sharedPage.status, 200);
  assert.match(await sharedPage.text(), /唯讀分享/);
  const revoke = await api(`/api/shares/${encodeURIComponent(share.data.id)}`, { method: "DELETE" });
  assert.equal(revoke.status, 200);
  const revokedPage = await mf.dispatchFetch(`http://homeplay.test/s/${share.data.token}`);
  assert.match(await revokedPage.text(), /分享連結已失效/);

  const ledger = await d1.prepare("SELECT reason, COUNT(*) AS count FROM render_ledger WHERE user_id = ? GROUP BY reason ORDER BY reason").bind("workflow-test-user").all();
  assert.deepEqual(ledger.results, [
    { reason: "check_in_grant", count: 1 },
    { reason: "render_charge", count: 3 },
    { reason: "render_refund", count: 1 },
  ]);
});
