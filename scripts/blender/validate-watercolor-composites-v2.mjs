import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../..");
const outputDirectory = path.join(root, "outputs/blender/watercolor-pipeline-v2");

const candidates = [
  { filename: "watercolor-commerce-audit.png", mode: "exact", exactMatch: 1 },
  { filename: "watercolor-harmonized-proposal.png", mode: "harmonized" },
];

const validated = [];
for (const candidate of candidates) {
  const image = await readFile(path.join(outputDirectory, candidate.filename));
  assert.equal(image.toString("ascii", 1, 4), "PNG", `${candidate.filename} is not PNG`);
  assert.deepEqual(
    [image.readUInt32BE(16), image.readUInt32BE(20)],
    [1440, 900],
    `${candidate.filename} must remain registered to the Blender plate`,
  );

  const report = JSON.parse(
    await readFile(
      path.join(outputDirectory, candidate.filename.replace(/\.png$/, ".report.json")),
      "utf8",
    ),
  );
  assert.equal(report.productMode, candidate.mode);
  if (candidate.exactMatch !== undefined) {
    assert.equal(report.productInteriorPixelMatch, candidate.exactMatch);
  } else {
    assert.ok(report.productInteriorPixelMatch < 1);
  }
  validated.push({
    filename: candidate.filename,
    productMode: report.productMode,
    productInteriorPixelMatch: report.productInteriorPixelMatch,
  });
}

const validationReport = {
  schemaVersion: "2.0",
  geometryRegistration: [1440, 900],
  outputs: validated,
  machineGate: "pass",
  humanVisualGate: "proposal-review-required",
};
await writeFile(
  path.join(outputDirectory, "composite-validation-report.json"),
  `${JSON.stringify(validationReport, null, 2)}\n`,
);
console.log("Validated exact commerce audit and harmonized watercolor proposal outputs.");
