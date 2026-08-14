import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rename, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import validator from "gltf-validator";

const execFileAsync = promisify(execFile);
const assetDirectory = path.resolve("public/assets/hero-room");
const manifestPath = path.join(assetDirectory, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const executable = path.resolve(
  "node_modules/.bin",
  process.platform === "win32" ? "gltf-transform.cmd" : "gltf-transform",
);
const stagingDirectory = await mkdtemp(path.join(tmpdir(), "homeplay-gltf-"));
const optimizedAssets = [];

try {
  for (const file of manifest.assets) {
    assert.equal(path.basename(file), file, `Unsafe asset path in manifest: ${file}`);
    const sourcePath = path.join(assetDirectory, file);
    const stagedPath = path.join(stagingDirectory, file);
    const before = (await stat(sourcePath)).size;

    await execFileAsync(executable, [
      "optimize",
      sourcePath,
      stagedPath,
      "--compress", "meshopt",
      "--flatten", "false",
      "--join", "false",
      "--palette", "false",
      "--instance", "false",
      "--simplify", "false",
      "--texture-compress", "false",
    ], { maxBuffer: 10 * 1024 * 1024 });

    const bytes = await readFile(stagedPath);
    const report = await validator.validateBytes(toUint8Array(bytes), {
      uri: file,
      writeTimestamp: false,
      maxIssues: 0,
    });
    assert.equal(report.issues.numErrors, 0, `${file} failed Khronos validation`);
    assert.equal(report.issues.numWarnings, 0, `${file} has Khronos validation warnings`);

    optimizedAssets.push({
      file,
      stagedPath,
      destinationPath: sourcePath,
      before,
      after: bytes.byteLength,
    });
  }

  // Do not replace any released file until the complete staged asset set passes.
  for (const asset of optimizedAssets) {
    await rename(asset.stagedPath, asset.destinationPath);
  }
} finally {
  await rm(stagingDirectory, { recursive: true, force: true });
}

const beforeTotal = optimizedAssets.reduce((total, asset) => total + asset.before, 0);
const afterTotal = optimizedAssets.reduce((total, asset) => total + asset.after, 0);
console.log(`Optimized ${optimizedAssets.length} hero-room GLB assets with Meshopt.`);
console.log(`${formatBytes(beforeTotal)} -> ${formatBytes(afterTotal)} (${formatPercent(afterTotal / beforeTotal)} of source size)`);
for (const asset of optimizedAssets) {
  console.log(`${asset.file}: ${formatBytes(asset.before)} -> ${formatBytes(asset.after)}`);
}

function toUint8Array(buffer) {
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatPercent(ratio) {
  return `${(ratio * 100).toFixed(1)}%`;
}
