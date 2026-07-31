import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("builds the branded co-marketing experience", async () => {
  const [page, layout, experience, clientAssets] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/home-play-app.tsx", import.meta.url), "utf8"),
    readdir(new URL("../dist/client/assets/", import.meta.url)),
  ]);
  assert.match(layout, /lang="zh-Hant"/);
  assert.match(page, /居遊所 Play Ground × 河岸青/);
  assert.match(experience, /森沐建設 × 居遊所 Play Ground/);
  assert.match(experience, /先住進你的/);
  assert.match(experience, /開始打造我的家/);
  assert.ok(clientAssets.some((file) => file.startsWith("home-play-app-") && file.endsWith(".js")));
  assert.ok(clientAssets.some((file) => file.startsWith("experience-canvas-") && file.endsWith(".js")));
  assert.ok(clientAssets.some((file) => file.startsWith("rapier-") && file.endsWith(".js")));
  assert.doesNotMatch(`${page}\n${layout}\n${experience}`, /codex-preview|Your site is taking shape|SkeletonPreview|react-loading-skeleton/i);
});

test("publishes a versioned experience manifest contract", async () => {
  const [manifest, catalog] = await Promise.all([
    readFile(new URL("../app/api/v1/experience/manifest/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/catalog.ts", import.meta.url), "utf8"),
  ]);
  assert.match(manifest, /schemaVersion: "1\.0"/);
  assert.match(manifest, /name: "河岸青"/);
  assert.match(manifest, /photorealRender: "adapter"/);
  assert.match(manifest, /socialLogin: \["google", "apple", "line"\]/);
  assert.equal((catalog.match(/area: "/g) ?? []).length, 3);
  assert.equal((catalog.match(/palette:/g) ?? []).length, 5);
  assert.ok((catalog.match(/assetVersion:/g) ?? []).length >= 8);
});

test("removes disposable starter assets and retains the generated brand card", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<HomePlayApp \/>/);
  assert.match(layout, /og-homeplay\.png/);
  assert.match(packageJson, /"name": "homeplay-play-ground"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
  await access(new URL("../public/og-homeplay.png", import.meta.url));
  await access(new URL("../drizzle/0000_busy_phil_sheldon.sql", import.meta.url));
  await access(root);
});
