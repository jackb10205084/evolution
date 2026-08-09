# A6 Commercial Vertical Slice

Last updated: 2026-08-09

## Outcome

Prove one commercially usable journey before expanding the catalog or floorplans:

`A6 co-marketing page -> sign in -> configure 8 owned SKUs -> save/share -> book or checkout -> request one render`.

The current public experience remains an Alpha proposal. Only gates recorded in
`public/assets/commercial-pilot/manifest.json` may be represented as ready.

## Module map

### EditorEngine Module

Seam: `app/lib/editor-engine.ts`.

Interface:

- `load()` selects a floorplan and resets a deterministic editing session.
- `dispatch()` accepts editing commands and returns an `EditorView` plus at most one user-facing effect.
- `snapshot()` returns an isolated scene snapshot for persistence, sharing, commerce and rendering.

Implementation owned by the Module:

- oriented furniture collision after rotation;
- footprint and wall validation;
- door clearance blocking;
- rug-under-furniture exception;
- drag history coalescing, undo and redo;
- circulation warnings that do not block saving.

React and React Three Fiber are callers. They must not reimplement these rules.

### AssetPipeline Module

Current seam: `public/assets/commercial-pilot/manifest.json` plus
`scripts/audit-commercial-pilot.mjs`.

The production Blender Adapter is not implemented. The existing deterministic
primitive builder remains a prototype Adapter and cannot satisfy the release gate.

## Release gates

1. V2 original-cozy art direction approved.
2. EditorEngine interface tests pass.
3. A6 CAD/Blender model regresses against the drawing dimensions.
4. At least eight owned SKUs have manufacturer source packs, web assets, render assets and colliders.
5. One ECPay sandbox order completes idempotently.
6. One Blender render job completes, stores an output and preserves protected product pixels.

`npm run pilot:audit` reports progress without pretending blocked gates are ready.
`npm run pilot:release` is intentionally failing until every commercial gate is satisfied.

## Next implementation slice

1. Replace candidate SKU metadata with measured source packs supplied by the furniture brand.
2. Add a Blender CLI Adapter that emits web GLB, render GLB, collider and validation report.
3. Import the verified A6 Blender shell without changing the EditorEngine Interface.
4. Add fixed 1440x900 and iPad landscape visual baselines after the real shell and first three owned SKUs land.
