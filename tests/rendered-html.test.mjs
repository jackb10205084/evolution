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
  assert.match(page, /居遊所 Play Ground × 遠雄樂元｜概念提案/);
  assert.match(experience, /proposalProject\.name.*居遊所 Play Ground/);
  assert.match(experience, /未委託概念提案/);
  assert.match(experience, /把自然遊園/);
  assert.match(experience, /開始打造我的家/);
  assert.ok(clientAssets.some((file) => file.startsWith("home-play-app-") && file.endsWith(".js")));
  assert.ok(clientAssets.some((file) => file.startsWith("experience-canvas-") && file.endsWith(".js")));
  assert.ok(clientAssets.some((file) => file.startsWith("rapier-") && file.endsWith(".js")));
  assert.doesNotMatch(`${page}\n${layout}\n${experience}`, /codex-preview|Your site is taking shape|SkeletonPreview|react-loading-skeleton/i);
});

test("publishes a versioned experience manifest contract", async () => {
  const [manifest, catalog, project] = await Promise.all([
    readFile(new URL("../app/api/v1/experience/manifest/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/catalog.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/project.ts", import.meta.url), "utf8"),
  ]);
  assert.match(manifest, /schemaVersion: "1\.0"/);
  assert.match(project, /name: "遠雄樂元"/);
  assert.match(project, /farglory-realty\.com\.tw\/buildings\/bh7/);
  assert.match(manifest, /photorealRender: "adapter"/);
  assert.match(manifest, /socialLogin: \["google", "apple", "line"\]/);
  assert.match(catalog, /SALTSJÖBADEN 雙人座沙發/);
  assert.match(catalog, /partnershipStatus: "demo"/);
  assert.match(catalog, /ikea\.com\.tw\/zh\/products/);
  assert.equal((catalog.match(/area: "/g) ?? []).length, 4);
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
  assert.match(layout, /og-homeplay-mascot\.png/);
  assert.match(packageJson, /"name": "homeplay-play-ground"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
  await access(new URL("../public/og-homeplay-mascot.png", import.meta.url));
  await access(new URL("../drizzle/0000_busy_phil_sheldon.sql", import.meta.url));
  await access(root);
});

test("locks the production experience to the approved V2 visual contract", async () => {
  const [experience, scene, presentation, contract, styles] = await Promise.all([
    readFile(new URL("../app/home-play-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/components/experience-canvas.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/scene-presentation.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/visual-contract.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(contract, /v2-original-cozy/);
  assert.match(experience, /HOMEPLAY_VISUAL_VERSION/);
  assert.match(experience, /客餐廳/);
  assert.match(experience, /全屋/);
  assert.match(styles, /09-a6-original-ultra-kawaii-mascot\.png/);
  assert.match(scene, /FloorplanColliders/);
  assert.match(scene, /AuditFloorplan/);
  assert.match(scene, /PresentationFloorplan/);
  assert.match(presentation, /renderer/);
  assert.match(presentation, /residentAnchor/);
  assert.doesNotMatch(scene, /ACESFilmicToneMapping|ContactShadows|castShadow|receiveShadow/);
  assert.doesNotMatch(`${experience}\n${scene}`, /水豚/);
  await access(new URL("../public/key-art/v2/09-a6-original-ultra-kawaii-mascot.png", import.meta.url));
  await access(new URL("../docs/design-system/v2-visual-contract.md", import.meta.url));
  await access(new URL("../docs/design-system/hero-room-visual-baselines.md", import.meta.url));
});

test("publishes only drawing-backed floorplans as playable shells", async () => {
  const [shell, a11Shell, runtime, scene, experience, catalog, manifest] = await Promise.all([
    readFile(new URL("../app/lib/a6-shell.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/a11-shell.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/floorplan-runtime.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/components/experience-canvas.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/home-play-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lib/catalog.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/v1/experience/manifest/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(shell, /const width = 6\.825/);
  assert.match(shell, /const pdfBounds = \{ x0: 146\.4, y0: 137\.04, x1: 534\.84, y1: 655\.8 \}/);
  assert.match(shell, /const depth = \(pdfBounds\.y1 - pdfBounds\.y0\) \* scale/);
  assert.match(shell, /footprint/);
  assert.match(shell, /openings/);
  assert.doesNotMatch(shell, /const depth = 6\.075/);
  assert.match(shell, /dimensions: 2/);
  assert.match(shell, /furnishedPlan: 3/);
  assert.match(shell, /ceilingAndHeights: 7/);
  assert.match(a11Shell, /const scale = 8\.65 \/ \(515\.52 - 8\.04\)/);
  assert.match(a11Shell, /const width = \(pdfBounds\.x1 - pdfBounds\.x0\) \* scale/);
  assert.match(a11Shell, /footprint/);
  assert.match(a11Shell, /openings/);
  assert.match(a11Shell, /dimensions: 13/);
  assert.match(a11Shell, /furnishedPlan: 14/);
  assert.match(a11Shell, /ceilingAndHeights: 18/);
  assert.match(runtime, /getFloorplanRuntime/);
  assert.match(runtime, /resolveFloorplanPlacement/);
  assert.match(scene, /getFloorplanRuntime/);
  assert.doesNotMatch(scene, /LegacyDollhouse/);
  assert.match(experience, /sourceStatus === "ready"/);
  assert.match(catalog, /id: "bh7-a6"[\s\S]*sourceStatus: "ready"/);
  assert.match(catalog, /id: "bh7-a11"[\s\S]*sourceStatus: "ready"/);
  assert.match(manifest, /floorplanShells/);
  await access(new URL("../docs/assets/bh7-floorplan-source-audit.md", import.meta.url));
});

test("keeps all 3D assets on the approved deterministic V2 contract", async () => {
  const [manifestText, packageJson] = await Promise.all([
    readFile(new URL("../public/assets/hero-room/manifest.json", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  const manifest = JSON.parse(manifestText);
  assert.equal(manifest.version, 2);
  assert.equal(manifest.visualContractVersion, "v2-original-cozy");
  assert.equal(manifest.style, "high-key-pastel-dollhouse");
  assert.equal(manifest.pipeline.optimizer, "@gltf-transform/cli");
  assert.equal(manifest.pipeline.compression, "meshopt");
  assert.equal(manifest.pipeline.simplifiesGeometry, false);
  assert.ok(manifest.assets.includes("mascot-resident.glb"));
  assert.match(packageJson, /assets:validate/);
  assert.match(packageJson, /assets:optimize/);
  await access(new URL("../scripts/validate-hero-assets.mjs", import.meta.url));
  await access(new URL("../scripts/optimize-hero-assets.mjs", import.meta.url));
});
