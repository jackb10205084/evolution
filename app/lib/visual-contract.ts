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
    roomOutlineStrength: 0.46,
    objectOutlineStrength: 1.22,
    objectOutlineThickness: 0.88,
    selectedOutlineStrength: 1.65,
    cutawayOpacity: 0.7,
    watercolorWash: 0.2,
  },
  physical: {
    themeLerpScale: 0.12,
    toonFlat: true,
    roomOutlineStrength: 0.14,
    objectOutlineStrength: 0.42,
    objectOutlineThickness: 0.4,
    selectedOutlineStrength: 0.85,
    cutawayOpacity: 0.9,
    watercolorWash: 0,
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
    outlineOpacity: 0.24,
    seamOpacity: 0.06,
    // ~40° ortho dollhouse; balcony (-Z) up, entry (+Z) down; SE two-wall cutaway.
    cameraPosition: [7.7, 10.35, 8.85] as const,
    cameraRotation: [-0.8327255514444918, 0.5296358409814999, 0.49856027621232585] as const,
    cameraTarget: [0, 0.62, 0] as const,
    cameraZoom: 68,
  },
  light: {
    cute: {
      ambient: { color: "#fffdf8", intensity: 0.5 },
      hemisphere: { sky: "#fff3e2", ground: "#c5d2e0", intensity: 0.84 },
      key: { position: [-3.2, 7.4, -6.6] as const, color: "#fff0c4", intensity: 0.34 },
      fill: { position: [6.2, 3.6, 7.0] as const, color: "#d4e1ef", intensity: 0.1 },
    },
    physical: {
      ambient: { color: "#fffdf8", intensity: 0.58 },
      hemisphere: { sky: "#fff8ee", ground: "#d4c8c0", intensity: 0.7 },
      key: { position: [6.5, 10, 7.5] as const, color: "#fff4e0", intensity: 0.42 },
      fill: { position: [-5, 5, -3] as const, color: "#d7e4f0", intensity: 0.16 },
    },
  },
} as const;
