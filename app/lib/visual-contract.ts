export const HOMEPLAY_VISUAL_VERSION = "v2-original-cozy" as const;

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
    background: "#ece7df",
    fog: "#ece7df",
    outline: "#8e7c76",
    outlineOpacity: 0.38,
    seamOpacity: 0.08,
    cameraPosition: [7.4, 9.8, 9.4] as const,
    cameraRotation: [-0.7735580278005101, 0.5129288489597703, 0.44690705595900726] as const,
    cameraTarget: [0, 0.62, 0] as const,
    cameraZoom: 68,
  },
} as const;
