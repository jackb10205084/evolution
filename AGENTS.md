# 居遊所 Play Ground Agent Guide

## Product truth

This repository is the BH7 co-marketing proposal and product prototype for 居遊所 Play Ground. The first conversion is booking a property visit. The editor, owned-furniture commerce, affiliate links, rendering credits, sharing, and builder operations must remain usable while visual work evolves.

## Read before changing visual or 3D work

1. `docs/design-system/v2-visual-contract.md`
2. `docs/assets/bh7-floorplan-source-audit.md`
3. `app/lib/visual-contract.ts`
4. `app/lib/a6-shell.ts`
5. `public/assets/hero-room/manifest.json`

Reference precedence is strict:

1. Building geometry and dimensions: verified builder drawing.
2. Character roundness, palette, line and lighting: approved V2 key art 09.
3. UI hierarchy: approved editor layout and visual contract.
4. Product shape and scale: SKU source and measured product data.

Do not average conflicting references.

## Non-negotiable visual rules

- Use the original `v2-original-cozy` direction; never reproduce a copyrighted character, game UI, logo, sound, or signature silhouette.
- Use high-key diffuse pastel lighting, matte surfaces and low-contrast cocoa/blue outlines.
- Never add ACES filmic tone mapping, bloom, vignette, heavy AO, deep cast shadows, glossy plastic or photo wood grain to the game editor.
- Do not call a room “accurate”, “formal” or “construction-ready” unless its status and source pages are recorded in the floorplan audit.
- Missing formal drawings means disabled UI, not a duplicated placeholder room.

## Local workflow

```sh
npm run dev:preview
npm run preview:check
npm run assets:build
npm run assets:validate
npm run floorplans:validate
npm run lint
npm test
```

The stable local preview URL is `http://localhost:3002/`. Keep the preview process running during review. `preview:check` is the source of truth for reachability.

## 3D asset gate

- GLB units are meters, +Y is up, and the pivot sits on the floor.
- Every released asset must be listed in `public/assets/hero-room/manifest.json`.
- Run `npm run assets:validate` after changing any asset or the builder.
- Core scene validation starts with shell, sofa, table and original resident. Expand the catalog only after those read as one art direction.
- Product dimensions and shell boundaries stay exact; AI may propose silhouettes and surface treatment but cannot invent construction dimensions.

## Floorplan gate

- `bh7-a6` and `bh7-a11` are playable PDF-traced audit shells with source-coordinate walls, openings and stepped footprints.
- Both still require human visual review and Blender/CAD verification before formal-model status; proportional PDF depth is not a builder-confirmed overall dimension.
- Proposal-only floorplans remain disabled until formal source drawings arrive.
- Physical violations block placement. Circulation or lighting concerns only warn.

## Definition of done

A visual/3D change is not complete with a successful build alone. It needs:

1. source and visual-contract traceability;
2. asset and placement validation;
3. lint, build and test pass;
4. reachable preview URL;
5. fixed-viewport visual review when the browser environment permits it;
6. an explicit note for any gate still awaiting human approval or external art tooling.
