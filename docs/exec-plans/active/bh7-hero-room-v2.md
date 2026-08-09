# BH7 Hero Room V2 — Active execution plan

Last updated: 2026-08-09

## Outcome

Deliver a trustworthy, playable BH7 proposal in the approved original cozy art direction. Building geometry must be traceable to the supplied drawings; furniture and resident assets must share one deterministic web-ready asset contract.

## Current gate status

- [x] Gate 0 — one approved art direction and visual contract.
- [x] Gate 1 — branded UI shell and full product flow remain wired.
- [x] Gate 2A — A6 PDF source audit and drawing-aligned runtime shell.
- [x] Gate 2B — A6 browser placement bounds and wall collision blocking.
- [x] Gate 3A — deterministic V2 GLB builder and asset validator.
- [ ] Gate 3B — human visual approval of A6 shell + sofa + table + resident in the live editor.
- [ ] Gate 3C — AI 3D candidates formally retopologized and normalized with external 3D tooling.
- [x] Gate 4A — A11 runtime shell, collision map and real floorplan switching.
- [ ] Gate 4B — fixed-viewport screenshot baselines and visual regression runner.

## Decisions

- The old generic dollhouse has been removed from production code.
- `bh7-a6` and `bh7-a11` each load an independent drawing-aligned Beta shell. Rooms without verified drawings are disabled.
- The A6 and A11 shells are now `drawing-audit-runtime-shell`: they can be compared against PDF overlays, but are not Blender/CAD-issued construction models.
- Runtime art uses the `v2-original-cozy` manifest. Every generated GLB must pass scale, floor pivot, material and triangle-budget validation.
- The browser automation environment currently rejects localhost navigation. Reachability is verified by `npm run preview:check`; visual approval stays open instead of being falsely marked complete.

## Next executable slice

1. Review the live A6 room at `http://localhost:3002/` in 1440×900 and iPad landscape.
2. Record only concrete deltas against key art 09: silhouette, palette, framing, lighting and UI density.
3. Apply one delta class at a time and retain identical scene data and camera.
4. Review A11 independently using PDF pages 13, 14 and 18; do not transfer A6-specific visual fixes blindly.

## Acceptance commands

```sh
npm run assets:validate
npm run floorplans:validate
npm run lint
npm test
npm run preview:check
```
