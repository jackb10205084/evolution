import manifest from "../../public/assets/commercial-pilot/manifest.json";

/** Source of truth for what may be represented as commercially ready. */
export const commercialPilot = manifest;

export const commercialPilotProgress = {
  ready: manifest.releaseGates.filter((gate) => gate.status === "ready").length,
  total: manifest.releaseGates.length,
  blocked: manifest.releaseGates.filter((gate) => gate.status !== "ready").length,
} as const;
