import { access } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repositoryRoot = path.resolve(import.meta.dirname, "../..");

const candidates = [
  process.env.BLENDER_BIN,
  "/Applications/Blender.app/Contents/MacOS/Blender",
  "/Volumes/Blender/Blender.app/Contents/MacOS/Blender",
  path.join(process.env.HOME ?? "", "Applications/Blender.app/Contents/MacOS/Blender"),
].filter(Boolean);

const blender = await firstExisting(candidates);
if (!blender) {
  throw new Error(
    "Blender executable not found. Install Blender.app in /Applications or set BLENDER_BIN.",
  );
}

run(process.execPath, [
  "--import",
  "tsx",
  path.join(repositoryRoot, "scripts/blender/export-a6-painterly-spec.ts"),
]);

run(blender, [
  "--background",
  "--factory-startup",
  "--python-exit-code",
  "1",
  "--python",
  path.join(repositoryRoot, "scripts/blender/build-painterly-pilot.py"),
  "--",
  "--repo-root",
  repositoryRoot,
]);

run("python3", [
  path.join(repositoryRoot, "scripts/blender/postprocess-handdrawn.py"),
  "--input",
  path.join(repositoryRoot, "outputs/blender/painterly-v1/a6-painterly-overview.png"),
  "--output",
  path.join(repositoryRoot, "outputs/blender/painterly-v1/a6-painterly-overview.png"),
  "--beauty-copy",
  path.join(repositoryRoot, "outputs/blender/painterly-v1/a6-painterly-beauty.png"),
]);

run(process.execPath, [path.join(repositoryRoot, "scripts/blender/validate-painterly-pilot.mjs")]);

async function firstExisting(paths) {
  for (const candidate of paths) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Continue to the next standard installation location.
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
