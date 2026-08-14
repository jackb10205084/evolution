# Hand-illustrated diorama V2

Status: Golden Room visual gate; Blender and website promotion are blocked until
the fixed-view image is approved.

## Reference boundary

The Pinterest image at <https://www.pinterest.com/pin/593701163371592069/>
is used only to identify high-level production traits: an isometric cutaway,
pressure-varied ink lines, painted fills, imperfect constructed edges and dense
lived-in dressing. Do not reproduce its room, palette, props, layout or artist's
specific marks.

The HomePlay version remains an original Taiwanese apartment with neutral
daylight, low saturation, commercially recognizable furniture and BH7-derived
architecture.

## Why painterly V1 failed

| Layer | Painterly V1 | Required V2 |
| --- | --- | --- |
| Geometry | Regular rounded primitives | Product-accurate geometry with selective hand-built irregularity |
| Line | Uniform render/post-process edge | Authored warm-charcoal strokes with pressure and small wobble |
| Colour | Smooth lit 3D material | Baked watercolor/gouache albedo with restrained paper tooth |
| Composition | Cropped multi-room floor plan | One complete, centered cutaway living/dining diorama |
| Dressing | Sparse demo props | Dense but buyable household goods in separate dressing collection |
| Web treatment | Generic PBR | Matte unlit/toon base plus stable screen-space outline |

## Golden Room target

Candidate image:
`outputs/golden-room/bh7-a6-hand-illustrated-style-lock-v4-watercolor-clean.png`

The previous `v2-contrast` and `v3-airy` candidates are retained only as
rejected colour/medium experiments. V3's colored-pencil-like surface must not
be used as the Blender material target.

Keep:

- 35–40 degree near-orthographic cutaway room.
- Light powder blue-gray surround with a clear coloured room interior.
- Pale shell-pink walls, dusty-lilac shadow, misty teal accents, muted light
  honey-oak and limited butter-cream highlights.
- Softened plum-gray ink; never black or vector-sharp.
- Transparent watercolor washes with paper luminosity, wet-on-wet blooms,
  sparse granulation and selective pigment pooling.
- Realistic furniture footprint and usable walking paths.
- A single illustration language across architecture, products and props.

Reject:

- A normal 3D render with a paper/noise filter.
- Plastic gradients, cinematic shadows or glossy highlights.
- Near-black surround, night-scene mood, intense burgundy or heavy rust cast.
- Colored-pencil grain, hatching, stippling, repeating embossed texture,
  uniform paper filters or opaque gouache-like fill.
- Sparse rooms, perfectly straight vector outlines or mismatched asset styles.
- AI changes to BH7 geometry or product dimensions.

## Colour and contrast key

| Role | Target | Value range |
| --- | --- | --- |
| Surround | `#B9C9CF` powder blue-gray | 68–76% |
| Ink/deep crevice | `#5C5662` plum-gray | 30–38% |
| Contact/corner shadow | `#B3AAB9` dusty lilac | 48–56% |
| Wall/midtone | `#E3C6C4` pale shell pink | 66–82% |
| Cool accent | `#9FB8B4` misty teal | 58–72% |
| Wood | `#C9AA83` light muted honey-oak | 58–76% |
| Focal highlight | `#F3E6BD` pale butter cream | 90–96% |

Do not apply a global warm/orange filter. Use medium-low contrast with short,
soft coloured shadows and a few local lamp/window highlights. No area may
approach black; the room must remain light, gentle and readable.

## Watercolor material key

- Walls/background: broad wet-on-wet washes with large quiet areas.
- Furniture/products: controlled wet-on-dry transparent glazing; product edges
  remain dimensionally readable.
- Shadows: one or two translucent coloured layers, never graphite hatching.
- Texture: irregular cold-press cotton fibres and sparse granulation only; no
  repeating or tiled pattern.
- Edge behaviour: selective pigment pooling and tide marks, not a global noise
  overlay.
- Highlights: reserved paper white rather than glossy white specular spots.

## Blender rebuild sequence after approval

1. Reframe A6 as a complete living/dining cutaway while retaining the full
   authoritative shell outside the hero render collection.
2. Replace proxy furniture with product-shaped subdivision models.
3. UV unwrap and bake original transparent-watercolor albedo/roughness atlases;
   dimensions stay in geometry, not in the painted image. Do not use a generic
   tiled paper or pencil texture.
4. Author line weight by object class and add a separate lifestyle-prop layer.
5. Export beauty, line and object-ID passes for deterministic compositing.
6. Build a web-safe toon/outline material and compare it against the Blender
   fixed-view render before asset-manifest promotion.
