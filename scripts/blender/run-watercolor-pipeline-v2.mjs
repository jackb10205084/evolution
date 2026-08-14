import { access } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");
const reuseBase = process.argv.includes("--reuse-base");
const sourceBlend = path.join(
  repositoryRoot,
  "artifacts/blender/painterly-v1/homeplay-a6-painterly-v1.blend",
);

const blenderCandidates = [
  process.env.BLENDER_BIN,
  "/Applications/Blender.app/Contents/MacOS/Blender",
  "/Volumes/Blender/Blender.app/Contents/MacOS/Blender",
  path.join(process.env.HOME ?? "", "Applications/Blender.app/Contents/MacOS/Blender"),
].filter(Boolean);

const blender = await firstExisting(blenderCandidates);
if (!blender) {
  throw new Error("Blender executable not found. Install Blender.app or set BLENDER_BIN.");
}

if (!reuseBase) {
  run(process.execPath, [path.join(repositoryRoot, "scripts/blender/run-painterly-pilot.mjs")]);
} else {
  await access(sourceBlend);
}

run(blender, [
  "--background",
  "--factory-startup",
  "--python-exit-code",
  "1",
  "--python",
  path.join(repositoryRoot, "scripts/blender/build-watercolor-pipeline-v2.py"),
  "--",
  "--repo-root",
  repositoryRoot,
]);

run("python3", [
  path.join(repositoryRoot, "scripts/blender/postprocess-watercolor-v2.py"),
  "--input-dir",
  path.join(repositoryRoot, "outputs/blender/watercolor-pipeline-v2"),
]);

run(process.execPath, [path.join(repositoryRoot, "scripts/blender/validate-watercolor-pipeline-v2.mjs")]);

async function firstExisting(paths) {
  for (const candidate of paths) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Continue through supported installation locations.
    }
  }
  return null;
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`${path.basename(command)} exited with status ${result.status}`);
  }
}
