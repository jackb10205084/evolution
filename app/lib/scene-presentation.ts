import { getFloorplanRuntime } from "./floorplan-runtime";
import { homePlayVisual } from "./visual-contract";

export type SceneView = "hero" | "whole";

export type ScenePresentation = {
  renderer: "audit" | "presentation";
  view: SceneView;
  camera: {
    position: readonly [number, number, number];
    target: readonly [number, number, number];
    zoom: number;
  };
  residentAnchor: readonly [number, number] | null;
};

type PresentationRecipe = {
  heroTarget: readonly [number, number, number];
  heroZoom: number;
  residentAnchor: readonly [number, number];
};

const presentationRecipes: Record<"bh7-a6" | "bh7-a11", PresentationRecipe> = {
  "bh7-a6": {
    heroTarget: [-1.68, 0.52, -0.7],
    heroZoom: 96,
    residentAnchor: [-0.48, -0.24],
  },
  "bh7-a11": {
    heroTarget: [-2.72, 0.52, 1.82],
    heroZoom: 76,
    residentAnchor: [-1.5, 1.32],
  },
};

export function getScenePresentation(
  floorplanId: string,
  requestedView: SceneView,
  auditMode: boolean,
): ScenePresentation {
  const runtime = getFloorplanRuntime(floorplanId) ?? getFloorplanRuntime("bh7-a6")!;
  const recipe = presentationRecipes[runtime.floorplanId];
  const view = auditMode ? "whole" : requestedView;
  const target = view === "hero" ? recipe.heroTarget : homePlayVisual.scene.cameraTarget;
  const zoom = auditMode
    ? runtime.audit.cameraZoom
    : view === "hero"
      ? recipe.heroZoom
      : runtime.cameraZoom;
  const cameraOffset = homePlayVisual.scene.cameraPosition;

  return {
    renderer: auditMode ? "audit" : "presentation",
    view,
    camera: {
      position: [cameraOffset[0] + target[0], cameraOffset[1], cameraOffset[2] + target[2]],
      target,
      zoom,
    },
    residentAnchor: auditMode ? null : recipe.residentAnchor,
  };
}
