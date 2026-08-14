# BH7 Hero Room V2 — Active execution plan

Last updated: 2026-08-10

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

## 2026-08-10 completeness pass (Gate 3B deltas applied)

Applied one delta class at a time against key art 09, same scene data and camera recipes:

- Shell: decorate-mode walls raised to readable dollhouse heights (full 2.06 m, cutaway 0.9–0.94 m) with baseboards; explore mode keeps low cutaways for character visibility.
- Openings: white window frames, mullions by panel width, distant-greenery band in glass, and cream curtain panels + wood rod on wide sliding doors (interior +z, both A6 sliders are rotY 0).
- Floor: procedural flat-tone plank CanvasTexture (no photo grain) layered on the slab top; audit mode unchanged.
- Fixed kitchen rebuilt as a full set: doored base cabinets with handles, wood counter, sink + faucet, two-burner hob, backsplash, upper cabinets, fridge, and counter props.
- Wall decor (decorate mode, A6 only): two framed prints and a clock on the left full wall at x = -3.24.
- Sunny theme now furnishes the whole unit: 7 owned + fejka/borgeby/kallax/lauters + bed-soft via new `bonusPositions` per floorplan (IKEA demo swap positions untouched).

Verified: lint clean, `npm test` 12/12 with build and asset/floorplan/pilot audits, in-browser review at 1440×900 and 1180×820 (desktop + iPad landscape). Human visual approval for Gate 3B remains open.

## 2026-08-10 sample-house feedback pass

Fixes from the on-site sample-house walkthrough (photos supplied):

- Explore-mode glitches: door leaves no longer render at full 2.1 m over 0.3 m cutaway stubs (they follow cutaway height, ajar angle reduced), window glass is capped below wall tops, and the window greenery band moved behind the glass to stop coplanar flicker.
- Fixed kitchen now has fixed colliders, so the resident cannot walk through the counter or fridge; resident spawn moved out of the new bed footprint to the dining hall.
- Default living-room layout re-curated from the A6 drawing: coffee table sits between sofa and balcony window, shelf hugs the left outer wall, plant/lamp/chair no longer overlap; wall art and clock repositioned above the new shelf line.
- Interior style aligned to the sample house: white cabinet fronts with grey quartz counter, chimney range hood, cream retro fridge with chrome handles, IH hob, lighter washed-oak floor, whiter sheer curtains.
- `sideFacingFurnitureIds` is now shared between the app and `validate-floorplan-runtime.mjs`, so rotated shelves validate with their true footprint.

Verified: lint clean, `npm test` 12/12, decorate + explore review in browser. Wall segments were re-checked against the p.2 trace; the "walls that should not exist" impression came from full-height door leaves and curtain slabs on stub walls, both fixed above.

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
