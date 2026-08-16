export const HOMEPLAY_VISUAL_VERSION = "v2-original-cozy" as const;

export type LookMode = "cute" | "physical";

/** Official site default. Lookdev preview also accepts "real" / "實品" as aliases of physical. */
export const defaultLookMode: LookMode = "cute";

/** Cute keeps current fillets. Physical straightens 0.05→~0.012 and fridge-class 0.12→~0.02. */
export function lookFillet(radius: number, look: LookMode = "cute") {
  if (look === "cute") return radius;
  if (radius >= 0.1) return 0.02;
  return Math.max(0.006, Number((radius * 0.24).toFixed(3)));
}

export const lookModeVisual = {
  cute: {
    themeLerpScale: 1,
    toonFlat: false,
    roomOutlineStrength: 0.34,
    objectOutlineStrength: 1.05,
    objectOutlineThickness: 0.78,
    selectedOutlineStrength: 1.65,
  },
  physical: {
    themeLerpScale: 0.12,
    toonFlat: true,
    roomOutlineStrength: 0.14,
    objectOutlineStrength: 0.42,
    objectOutlineThickness: 0.4,
    selectedOutlineStrength: 0.85,
  },
} as const;

export const homePlayVisual = {
  color: {
    milk: "#fffdf8",
    vanilla: "#fff6df",
    cream: "#f8ede0",
    peach: "#efac97",
    coral: "#df8f78",
    mint: "#a9c7a2",
    blue: "#b8cae1",
    blueLine: "#758caf",
    cocoa: "#655854",
    quietInk: "#817872",
  },
  scene: {
    background: "#f7f3ee",
    fog: "#f7f3ee",
    outline: "#9eafca",
    objectOutline: "#8f9eb8",
    outlineOpacity: 0.18,
    seamOpacity: 0.08,
    cameraPosition: [7.4, 9.8, 9.4] as const,
    cameraRotation: [-0.7735580278005101, 0.5129288489597703, 0.44690705595900726] as const,
    cameraTarget: [0, 0.62, 0] as const,
    cameraZoom: 68,
  },
} as const;
