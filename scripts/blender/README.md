# HomePlay Blender painterly pilot

This pipeline creates a parallel look-dev candidate. It does not overwrite the
released files in `public/assets/hero-room/`.

## Run

Install Blender in `/Applications/Blender.app`, keep the official DMG mounted at
`/Volumes/Blender`, or set `BLENDER_BIN` to the executable. Then run:

```sh
npm run blender:pilot:build
```

The command performs five deterministic steps:

1. Exports A6 walls, openings, product dimensions and the fixed camera from the
   TypeScript source of truth into `tmp/blender/a6-painterly-v1/scene-spec.json`.
2. Builds the Blender scene with named collections and source metadata.
3. Renders the fixed 1440x900 neutral beauty pass and exports the scene plus
   four core GLB assets with Meshopt compression.
4. Applies deterministic paper, pigment and pencil-line finishing without
   moving any geometry or product pixels.
5. Runs glTF, material, render-size and artifact validation.

## Outputs

- `artifacts/blender/painterly-v1/homeplay-a6-painterly-v1.blend`
- `outputs/blender/painterly-v1/a6-painterly-beauty.png` (neutral beauty pass)
- `outputs/blender/painterly-v1/a6-painterly-overview.png` (hand-drawn review plate)
- `outputs/blender/painterly-v1/build-report.json`
- `outputs/blender/painterly-v1/validation-report.json`
- `public/assets/blender-candidates/painterly-v1/*.glb`

The `.blend` collections separate architecture, products, lifestyle dressing,
the original resident and the render rig. Only the approved product collections
may later be promoted into `public/assets/hero-room/manifest.json`.
