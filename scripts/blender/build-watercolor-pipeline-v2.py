"""Build deterministic Watercolor Pipeline V2 passes from the A6 pilot scene.

The V1 scene remains the geometry/source asset. This script opens a copy,
removes global fake paper grain, emits a full-shell audit frame plus a dedicated
living/dining Golden Room frame, and writes the semantic passes used by the
AI-assisted but geometry-protected watercolor workflow.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def parse_args() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", required=True)
    return parser.parse_args(argv)


ARGS = parse_args()
ROOT = Path(ARGS.repo_root).resolve()
SOURCE_BLEND = ROOT / "artifacts/blender/painterly-v1/homeplay-a6-painterly-v1.blend"
OUTPUT_DIR = ROOT / "outputs/blender/watercolor-pipeline-v2"
ARTIFACT_DIR = ROOT / "artifacts/blender/watercolor-pipeline-v2"
PUBLIC_DIR = ROOT / "public/assets/blender-candidates/watercolor-pipeline-v2"
BLEND_PATH = ARTIFACT_DIR / "homeplay-a6-watercolor-pipeline-v2.blend"
BEAUTY_PATH = OUTPUT_DIR / "beauty-neutral.png"
AUDIT_PATH = OUTPUT_DIR / "audit-whole-floorplan.png"
MULTILAYER_PATH = OUTPUT_DIR / "a6-watercolor-v2-multilayer.exr"
GLB_PATH = PUBLIC_DIR / "bh7-a6-watercolor-v2.glb"
REPORT_PATH = OUTPUT_DIR / "build-report.json"

for directory in (OUTPUT_DIR, ARTIFACT_DIR, PUBLIC_DIR):
    directory.mkdir(parents=True, exist_ok=True)

if not SOURCE_BLEND.exists():
    raise FileNotFoundError(f"Missing V1 source scene: {SOURCE_BLEND}")

bpy.ops.wm.open_mainfile(filepath=str(SOURCE_BLEND))

scene = bpy.context.scene
view_layer = bpy.context.view_layer

COLLECTIONS = {
    "architecture": "Architecture_A6_Drawing_Audit",
    "furniture": "Furniture_SKU_Painterly",
    "lifestyle": "Lifestyle_Dressing",
    "resident": "Original_Resident",
    "render": "Render_Rig_Not_For_GLTF",
}

CAMERA_RECIPES = {
    "audit": {
        "target": (0.0, 0.0, 0.62),
        "offset": (7.8, -10.0, 10.78),
        "ortho_scale": 10.2,
    },
    # Geometry remains unchanged. Only the proposal camera is reframed around
    # the complete living/dining/kitchen composition.
    "golden_room": {
        "target": (-2.092, 0.131, 0.62),
        "offset": (7.8, -10.0, 10.78),
        "ortho_scale": 6.9,
    },
}


def hex_linear(value: str) -> tuple[float, float, float, float]:
    value = value.lstrip("#")
    srgb = tuple(int(value[index : index + 2], 16) / 255 for index in (0, 2, 4))
    linear = tuple(
        channel / 12.92
        if channel <= 0.04045
        else ((channel + 0.055) / 1.055) ** 2.4
        for channel in srgb
    )
    return linear + (1.0,)


def collection_objects(name: str) -> set[bpy.types.Object]:
    collection = bpy.data.collections.get(name)
    return set(collection.all_objects) if collection else set()


def remove_global_grain() -> list[str]:
    cleaned: list[str] = []
    for material in bpy.data.materials:
        if not material.use_nodes or not material.node_tree:
            continue
        nodes = material.node_tree.nodes
        for node_name in ("HP_PaperTooth", "HP_PencilGrain"):
            node = nodes.get(node_name)
            if node:
                nodes.remove(node)
                cleaned.append(f"{material.name}/{node_name}")
        principled = nodes.get("Principled BSDF")
        if principled:
            principled.inputs["Metallic"].default_value = 0.0
            principled.inputs["Roughness"].default_value = max(
                0.9, principled.inputs["Roughness"].default_value
            )
            if "Specular IOR Level" in principled.inputs:
                principled.inputs["Specular IOR Level"].default_value = min(
                    0.16, principled.inputs["Specular IOR Level"].default_value
                )
        material["homeplay_surface_contract"] = "watercolor-v2-no-global-grain"
    return cleaned


def configure_scene() -> None:
    scene.render.resolution_x = 1440
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    scene.render.use_file_extension = True

    # Standard is intentional for this NPR plate; the product audit remains a
    # separate PBR-neutral concern.
    try:
        scene.view_settings.view_transform = "Standard"
    except Exception:
        pass
    try:
        scene.view_settings.look = "Medium Low Contrast"
    except Exception:
        # Look names are OCIO-config dependent; the neutral Standard transform
        # and controlled light values remain the actual contract.
        pass
    scene.view_settings.exposure = 0.0
    scene.view_settings.gamma = 1.0

    resident = bpy.data.collections.get(COLLECTIONS["resident"])
    if resident:
        resident.hide_render = True

    camera = scene.camera
    if not camera:
        raise RuntimeError("A6 source scene has no active camera")
    apply_camera("golden_room")

    world = scene.world
    if world and world.use_nodes:
        background = world.node_tree.nodes.get("Background")
        if background:
            background.inputs["Color"].default_value = hex_linear("#f6f3ee")
            background.inputs["Strength"].default_value = 0.62

    try:
        scene.render.use_freestyle = True
        line_set = view_layer.freestyle_settings.linesets[0]
        line_set.linestyle.color = hex_linear("#5c5662")[:3]
        line_set.linestyle.alpha = 0.42
        line_set.linestyle.thickness = 1.1
        line_set.select_silhouette = True
        line_set.select_border = True
        line_set.select_crease = True
        line_set.select_material_boundary = False
    except Exception as error:
        print(f"Freestyle configuration unavailable: {error}")


def apply_camera(recipe_name: str) -> None:
    recipe = CAMERA_RECIPES[recipe_name]
    camera = scene.camera
    if not camera:
        raise RuntimeError("A6 source scene has no active camera")
    target = Vector(recipe["target"])
    offset = Vector(recipe["offset"])
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = recipe["ortho_scale"]
    camera.location = target + offset
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
    scene["homeplay_camera_recipe"] = recipe_name


def make_emission_material(name: str, color: str) -> bpy.types.Material:
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    emission = nodes.new("ShaderNodeEmission")
    emission.inputs["Color"].default_value = hex_linear(color)
    emission.inputs["Strength"].default_value = 1.0
    material.node_tree.links.new(emission.outputs["Emission"], output.inputs["Surface"])
    return material


def render_png(path: Path) -> None:
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.filepath = str(path)
    bpy.ops.render.render(write_still=True)


def object_is_renderable(obj: bpy.types.Object) -> bool:
    return obj.type in {"MESH", "CURVE", "SURFACE", "META", "FONT"}


def render_mask(path: Path, include: set[bpy.types.Object]) -> None:
    previous_hide = {obj.name: obj.hide_render for obj in scene.objects}
    previous_override = view_layer.material_override
    previous_freestyle = scene.render.use_freestyle
    world = scene.world
    background = world.node_tree.nodes.get("Background") if world and world.use_nodes else None
    previous_world_color = background.inputs["Color"].default_value[:] if background else None
    previous_world_strength = background.inputs["Strength"].default_value if background else None

    white = make_emission_material("HP_MASK__White", "#ffffff")
    view_layer.material_override = white
    scene.render.use_freestyle = False
    if background:
        background.inputs["Color"].default_value = (0.0, 0.0, 0.0, 1.0)
        background.inputs["Strength"].default_value = 0.0
    for obj in scene.objects:
        if object_is_renderable(obj):
            obj.hide_render = obj not in include
    render_png(path)

    for obj in scene.objects:
        obj.hide_render = previous_hide[obj.name]
    view_layer.material_override = previous_override
    scene.render.use_freestyle = previous_freestyle
    if background and previous_world_color is not None and previous_world_strength is not None:
        background.inputs["Color"].default_value = previous_world_color
        background.inputs["Strength"].default_value = previous_world_strength


def render_multilayer_exr() -> None:
    view_layer.use_pass_z = True
    view_layer.use_pass_normal = True
    view_layer.use_pass_diffuse_color = True
    if hasattr(view_layer, "use_pass_cryptomatte_object"):
        view_layer.use_pass_cryptomatte_object = True
        if hasattr(view_layer, "pass_cryptomatte_depth"):
            view_layer.pass_cryptomatte_depth = 6
    formats = {
        item.identifier
        for item in scene.render.image_settings.bl_rna.properties["file_format"].enum_items
    }
    exr_format = "OPEN_EXR_MULTILAYER" if "OPEN_EXR_MULTILAYER" in formats else "OPEN_EXR"
    try:
        scene.render.image_settings.file_format = exr_format
    except TypeError:
        # Blender 5.2 can expose MultiLayer in RNA but temporarily restrict the
        # enum after a still render. The semantic PNG passes remain the source
        # of truth, so fall back to a float EXR beauty instead of aborting.
        exr_format = "OPEN_EXR"
        scene.render.image_settings.file_format = exr_format
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "32"
    scene.render.filepath = str(MULTILAYER_PATH)
    bpy.ops.render.render(write_still=True)
    scene["homeplay_exr_format"] = exr_format
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_depth = "8"


def export_web_candidate() -> None:
    resident_objects = collection_objects(COLLECTIONS["resident"])
    render_objects = collection_objects(COLLECTIONS["render"])
    selected = [
        obj
        for obj in scene.objects
        if obj.get("homeplay_export") and obj not in resident_objects and obj not in render_objects
    ]
    bpy.ops.object.select_all(action="DESELECT")
    for obj in selected:
        obj.hide_viewport = False
        obj.hide_render = False
        obj.select_set(True)
    if selected:
        bpy.context.view_layer.objects.active = selected[0]
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_PATH),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_extras=True,
        export_cameras=False,
        export_lights=False,
        export_animations=False,
        export_yup=True,
        export_materials="EXPORT",
        export_meshopt_compression_enable=True,
        export_meshopt_extension="EXT_meshopt_compression",
    )


removed_nodes = remove_global_grain()
configure_scene()

architecture = collection_objects(COLLECTIONS["architecture"])
furniture = collection_objects(COLLECTIONS["furniture"])
lifestyle = collection_objects(COLLECTIONS["lifestyle"])
kitchen = {obj for obj in architecture if obj.name.startswith("HP_KITCHEN__")}
commerce = furniture | kitchen

apply_camera("audit")
render_png(AUDIT_PATH)
apply_camera("golden_room")
render_png(BEAUTY_PATH)
render_multilayer_exr()
render_mask(OUTPUT_DIR / "mask-architecture.png", architecture)
render_mask(OUTPUT_DIR / "mask-products.png", commerce)
render_mask(OUTPUT_DIR / "mask-lifestyle.png", lifestyle)

export_web_candidate()
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH), compress=True)

report = {
    "schemaVersion": "2.0",
    "candidateVersion": "watercolor-pipeline-v2",
    "status": "technical-sample-human-approval-required",
    "blenderVersion": bpy.app.version_string,
    "sourceBlend": str(SOURCE_BLEND.relative_to(ROOT)),
    "blendFile": str(BLEND_PATH.relative_to(ROOT)),
    "beauty": str(BEAUTY_PATH.relative_to(ROOT)),
    "wholeFloorplanAudit": str(AUDIT_PATH.relative_to(ROOT)),
    "multilayerExr": str(MULTILAYER_PATH.relative_to(ROOT)),
    "exrFormat": scene.get("homeplay_exr_format", "OPEN_EXR"),
    "glb": str(GLB_PATH.relative_to(ROOT)),
    "semanticMasks": {
        "architecture": "outputs/blender/watercolor-pipeline-v2/mask-architecture.png",
        "products": "outputs/blender/watercolor-pipeline-v2/mask-products.png",
        "lifestyle": "outputs/blender/watercolor-pipeline-v2/mask-lifestyle.png",
    },
    "removedGlobalGrainNodes": removed_nodes,
    "cameras": {
        name: {
            "type": "ORTHO",
            "target": recipe["target"],
            "orthoScale": recipe["ortho_scale"],
        }
        for name, recipe in CAMERA_RECIPES.items()
    },
    "renderSize": [scene.render.resolution_x, scene.render.resolution_y],
    "residentVisible": False,
    "sourceGate": "drawing-audit-runtime-shell; Blender/CAD verification still required",
}
REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(report, ensure_ascii=False, indent=2))
