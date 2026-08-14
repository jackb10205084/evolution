"""Build the BH7 A6 painterly look-dev pilot in Blender.

Run through `npm run blender:pilot:build`. The script deliberately keeps the
candidate assets separate from the released hero-room manifest until a human
approves the fixed-view render.
"""

from __future__ import annotations

import argparse
import json
import math
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
SPEC_PATH = ROOT / "tmp/blender/a6-painterly-v1/scene-spec.json"
OUTPUT_DIR = ROOT / "outputs/blender/painterly-v1"
BLEND_DIR = ROOT / "artifacts/blender/painterly-v1"
PUBLIC_DIR = ROOT / "public/assets/blender-candidates/painterly-v1"
RENDER_PATH = OUTPUT_DIR / "a6-painterly-overview.png"
BLEND_PATH = BLEND_DIR / "homeplay-a6-painterly-v1.blend"
SCENE_GLB_PATH = PUBLIC_DIR / "bh7-a6-painterly-pilot.glb"
REPORT_PATH = OUTPUT_DIR / "build-report.json"

for directory in (OUTPUT_DIR, BLEND_DIR, PUBLIC_DIR):
    directory.mkdir(parents=True, exist_ok=True)

with SPEC_PATH.open("r", encoding="utf-8") as stream:
    SPEC = json.load(stream)

PALETTE = SPEC["palette"]


def hex_color(value: str, alpha: float = 1.0) -> tuple[float, float, float, float]:
    value = value.lstrip("#")
    srgb = tuple(int(value[index : index + 2], 16) / 255 for index in (0, 2, 4))
    linear = tuple(channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4 for channel in srgb)
    return linear + (alpha,)


def to_blender_position(x: float, height: float, z: float) -> tuple[float, float, float]:
    """Map the runtime +Y-up coordinates into Blender's +Z-up coordinates."""
    return (x, -z, height)


def reset_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for datablock in list(datablocks):
            datablocks.remove(datablock)


def new_collection(name: str) -> bpy.types.Collection:
    collection = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(collection)
    return collection


def move_to_collection(obj: bpy.types.Object, collection: bpy.types.Collection) -> None:
    for source in list(obj.users_collection):
        source.objects.unlink(obj)
    collection.objects.link(obj)


def make_material(name: str, color: str, roughness: float = 0.94) -> bpy.types.Material:
    material = bpy.data.materials.new(name=f"HP_{name}")
    material.use_nodes = True
    material.diffuse_color = hex_color(color)
    material.metallic = 0.0
    material.roughness = roughness
    principled = material.node_tree.nodes.get("Principled BSDF")
    if principled:
        principled.inputs["Base Color"].default_value = hex_color(color)
        principled.inputs["Metallic"].default_value = 0.0
        principled.inputs["Roughness"].default_value = roughness
        if "Specular IOR Level" in principled.inputs:
            principled.inputs["Specular IOR Level"].default_value = 0.22
        # A shallow high-frequency normal variation breaks the perfectly
        # smooth CG surface. The authoritative GLB colour and roughness remain
        # on the Principled shader; this is a Blender look-dev layer.
        noise = material.node_tree.nodes.new("ShaderNodeTexNoise")
        noise.name = "HP_PaperTooth"
        noise.label = "Subtle paper tooth"
        noise.inputs["Scale"].default_value = 118.0
        noise.inputs["Detail"].default_value = 1.6
        noise.inputs["Roughness"].default_value = 0.72
        bump = material.node_tree.nodes.new("ShaderNodeBump")
        bump.name = "HP_PencilGrain"
        bump.label = "Pencil grain, render only"
        bump.inputs["Strength"].default_value = 0.028
        bump.inputs["Distance"].default_value = 0.018
        material.node_tree.links.new(noise.outputs["Fac"], bump.inputs["Height"])
        material.node_tree.links.new(bump.outputs["Normal"], principled.inputs["Normal"])
    material["homeplay_visual_contract"] = "v2-original-cozy+painterly-lookdev-v1"
    return material


def mark_export(obj: bpy.types.Object, role: str, source_page: int | None = None) -> None:
    obj["homeplay_export"] = True
    obj["homeplay_role"] = role
    if source_page is not None:
        obj["homeplay_source_page"] = source_page


def add_bevel(obj: bpy.types.Object, width: float, segments: int = 3) -> None:
    if width <= 0:
        return
    modifier = obj.modifiers.new(name="HP_SoftEdge", type="BEVEL")
    modifier.width = width
    modifier.segments = segments
    modifier.limit_method = "ANGLE"


def add_box(
    name: str,
    size: tuple[float, float, float],
    location: tuple[float, float, float],
    material: bpy.types.Material,
    collection: bpy.types.Collection,
    *,
    parent: bpy.types.Object | None = None,
    rotation_z: float = 0.0,
    bevel: float = 0.025,
    role: str = "asset",
    source_page: int | None = None,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=(0, 0, 0))
    obj = bpy.context.object
    obj.name = name
    move_to_collection(obj, collection)
    obj.dimensions = size
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    add_bevel(obj, min(bevel, min(size) * 0.42))
    obj.data.materials.append(material)
    if parent:
        obj.parent = parent
        obj.location = location
        obj.rotation_euler.z = rotation_z
    else:
        obj.location = location
        obj.rotation_euler.z = rotation_z
    mark_export(obj, role, source_page)
    return obj


def add_cylinder(
    name: str,
    radius: float,
    depth: float,
    location: tuple[float, float, float],
    material: bpy.types.Material,
    collection: bpy.types.Collection,
    *,
    parent: bpy.types.Object | None = None,
    scale_xy: tuple[float, float] = (1.0, 1.0),
    vertices: int = 28,
    role: str = "asset",
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=(0, 0, 0))
    obj = bpy.context.object
    obj.name = name
    move_to_collection(obj, collection)
    obj.scale.x = scale_xy[0]
    obj.scale.y = scale_xy[1]
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    add_bevel(obj, min(0.018, radius * 0.22), 2)
    obj.data.materials.append(material)
    if parent:
        obj.parent = parent
        obj.location = location
    else:
        obj.location = location
    mark_export(obj, role)
    return obj


def add_sphere(
    name: str,
    size: tuple[float, float, float],
    location: tuple[float, float, float],
    material: bpy.types.Material,
    collection: bpy.types.Collection,
    *,
    parent: bpy.types.Object | None = None,
    rotation: tuple[float, float, float] = (0, 0, 0),
    role: str = "asset",
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=28, ring_count=16, location=(0, 0, 0))
    obj = bpy.context.object
    obj.name = name
    move_to_collection(obj, collection)
    obj.scale = (size[0] / 2, size[1] / 2, size[2] / 2)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    obj.data.materials.append(material)
    if parent:
        obj.parent = parent
        obj.location = location
        obj.rotation_euler = rotation
    else:
        obj.location = location
        obj.rotation_euler = rotation
    mark_export(obj, role)
    return obj


def add_asset_root(
    asset_id: str,
    sku: str,
    size: dict[str, float],
    placement: dict[str, float],
) -> bpy.types.Object:
    root = bpy.data.objects.new(f"HP_ASSET__{asset_id}", None)
    FURNITURE.objects.link(root)
    root.empty_display_type = "CUBE"
    root.empty_display_size = 0.12
    root.location = to_blender_position(placement["x"], 0, placement["z"])
    root.rotation_euler.z = -placement.get("rotationY", 0)
    root["homeplay_export"] = True
    root["homeplay_role"] = "product-root"
    root["homeplay_asset_id"] = asset_id
    root["homeplay_sku"] = sku
    root["homeplay_floor_pivot"] = True
    root["homeplay_size_m"] = json.dumps(size, ensure_ascii=False)
    ASSET_ROOTS[asset_id] = root
    return root


def create_floor() -> None:
    footprint = SPEC["shell"]["footprint"]
    vertices = [(x, -z, 0.0) for x, z in footprint]
    mesh = bpy.data.meshes.new("HP_A6_FloorMesh")
    mesh.from_pydata(vertices, [], [list(range(len(vertices)))])
    mesh.update()
    floor = bpy.data.objects.new("HP_ARCH__A6_Floor", mesh)
    ARCHITECTURE.objects.link(floor)
    floor.data.materials.append(MATERIALS["floor"])
    solidify = floor.modifiers.new(name="HP_FloorThickness", type="SOLIDIFY")
    solidify.thickness = 0.16
    solidify.offset = -1.0
    add_bevel(floor, 0.025, 2)
    mark_export(floor, "architecture", SPEC["sourceTrace"]["dimensionsPage"])
    floor["homeplay_status"] = SPEC["shell"]["status"]

    # Thin floor-board seams add hand-built scale without photo textures.
    for index, y in enumerate([value * 0.42 for value in range(-9, 11)]):
        seam = add_box(
            f"HP_STYLE__FloorSeam_{index:02d}",
            (6.15, 0.006, 0.006),
            (0, y, 0.008),
            MATERIALS["floor_line"],
            LIFESTYLE,
            bevel=0.002,
            role="lifestyle-dressing",
        )
        seam["homeplay_collision"] = False


def create_walls() -> None:
    for wall in SPEC["shell"]["walls"]:
        full_height = wall["height"]
        wall_height = full_height if wall.get("view", "cutaway") == "full" else 0.52
        x, z = wall["center"]
        width, depth = wall["size"]
        obj = add_box(
            f"HP_ARCH__{wall['id']}",
            (width, depth, wall_height),
            to_blender_position(x, wall_height / 2, z),
            MATERIALS["wall"],
            ARCHITECTURE,
            rotation_z=-(wall.get("rotationY") or 0),
            bevel=0.018,
            role="architecture",
            source_page=wall["sourcePage"],
        )
        obj["homeplay_wall_kind"] = wall["kind"]
        obj["homeplay_wall_view"] = wall.get("view", "cutaway")


def create_openings() -> None:
    for opening in SPEC["shell"]["openings"]:
        x, z = opening["center"]
        root = bpy.data.objects.new(f"HP_OPENING__{opening['id']}", None)
        ARCHITECTURE.objects.link(root)
        root.location = to_blender_position(x, 0, z)
        root.rotation_euler.z = -opening["rotationY"]
        mark_export(root, "architecture-opening", opening["sourcePage"])
        width = opening["width"]
        height = opening["height"]
        thickness = max(0.055, opening["wallThickness"] * 0.42)
        frame = 0.055
        if opening["type"] == "sliding-door":
            add_box(f"{root.name}__Top", (width, thickness, frame), (0, 0, height), MATERIALS["window_frame"], ARCHITECTURE, parent=root, bevel=0.012, role="architecture-opening")
            add_box(f"{root.name}__Left", (frame, thickness, height), (-width / 2 + frame / 2, 0, height / 2), MATERIALS["window_frame"], ARCHITECTURE, parent=root, bevel=0.012, role="architecture-opening")
            add_box(f"{root.name}__Right", (frame, thickness, height), (width / 2 - frame / 2, 0, height / 2), MATERIALS["window_frame"], ARCHITECTURE, parent=root, bevel=0.012, role="architecture-opening")
            for ratio in (-0.25, 0, 0.25):
                add_box(f"{root.name}__Mullion_{ratio}", (0.025, thickness * 0.7, height - 0.08), (width * ratio, 0, height / 2), MATERIALS["window_frame"], ARCHITECTURE, parent=root, bevel=0.006, role="architecture-opening")
        else:
            add_box(f"{root.name}__Door", (width * 0.86, 0.055, min(2.06, height)), (width * 0.05, 0, min(2.06, height) / 2), MATERIALS["door"], ARCHITECTURE, parent=root, rotation_z=-0.16, bevel=0.035, role="architecture-opening")
            add_sphere(f"{root.name}__Knob", (0.065, 0.065, 0.065), (width * 0.34, -0.045, 1.02), MATERIALS["cocoa"], ARCHITECTURE, parent=root, role="architecture-opening")


def build_sofa(product: dict) -> None:
    root = add_asset_root(product["id"], product["sku"], product["size"], product["placement"])
    width = product["size"]["width"]
    depth = product["size"]["depth"]
    height = product["size"]["height"]
    add_box("HP_SOFA__Base", (width - 0.12, depth - 0.08, 0.24), (0, 0, 0.30), MATERIALS["sofa_oat"], FURNITURE, parent=root, bevel=0.11)
    add_box("HP_SOFA__Back", (width - 0.18, 0.18, height * 0.58), (0, depth * 0.31, 0.56), MATERIALS["sofa_oat"], FURNITURE, parent=root, rotation_z=0, bevel=0.085)
    for side in (-1, 1):
        add_box(f"HP_SOFA__Arm_{side}", (0.22, depth - 0.04, 0.43), (side * (width / 2 - 0.15), 0, 0.47), MATERIALS["sofa_oat"], FURNITURE, parent=root, bevel=0.09)
    for index, x in enumerate((-width * 0.24, width * 0.24)):
        add_box(f"HP_SOFA__Seat_{index}", (width * 0.44, depth * 0.64, 0.16), (x, -depth * 0.07, 0.50), MATERIALS["sofa_milk"], FURNITURE, parent=root, bevel=0.075)
        cushion = add_box(f"HP_SOFA__BackCushion_{index}", (width * 0.43, 0.14, 0.38), (x, depth * 0.23, 0.70), MATERIALS["sofa_milk"], FURNITURE, parent=root, bevel=0.075)
        cushion.rotation_euler.x = math.radians(-8)
    add_box("HP_SOFA__AccentCushion", (0.37, 0.13, 0.31), (0.48, -depth * 0.13, 0.69), MATERIALS["sage"], FURNITURE, parent=root, rotation_z=math.radians(-7), bevel=0.065)
    for x in (-width * 0.37, width * 0.37):
        for y in (-depth * 0.29, depth * 0.29):
            add_cylinder("HP_SOFA__Leg", 0.035, 0.16, (x, y, 0.08), MATERIALS["wood"], FURNITURE, parent=root, vertices=12)


def build_table(product: dict) -> None:
    root = add_asset_root(product["id"], product["sku"], product["size"], product["placement"])
    width = product["size"]["width"]
    depth = product["size"]["depth"]
    height = product["size"]["height"]
    add_box("HP_TABLE__Top", (width, depth, 0.09), (0, 0, height - 0.045), MATERIALS["wood_light"], FURNITURE, parent=root, bevel=0.11)
    add_cylinder("HP_TABLE__Pedestal", 0.13, height - 0.1, (0, 0, (height - 0.1) / 2), MATERIALS["wood"], FURNITURE, parent=root, scale_xy=(1.0, 0.8), vertices=24)
    add_cylinder("HP_TABLE__Foot", 0.28, 0.055, (0, 0, 0.028), MATERIALS["wood"], FURNITURE, parent=root, scale_xy=(1.2, 0.8), vertices=28)


def build_chair(product: dict) -> None:
    root = add_asset_root(product["id"], product["sku"], product["size"], product["placement"])
    width = product["size"]["width"]
    depth = product["size"]["depth"]
    height = product["size"]["height"]
    add_box("HP_CHAIR__Seat", (width * 0.72, depth * 0.7, 0.15), (0, 0, 0.43), MATERIALS["chair_cream"], FURNITURE, parent=root, bevel=0.075)
    back = add_box("HP_CHAIR__Back", (width * 0.7, 0.14, 0.36), (0, depth * 0.29, height * 0.72), MATERIALS["sage"], FURNITURE, parent=root, bevel=0.075)
    back.rotation_euler.x = math.radians(-7)
    for x in (-width * 0.31, width * 0.31):
        for y in (-depth * 0.27, depth * 0.27):
            add_cylinder("HP_CHAIR__Leg", 0.028, 0.42, (x, y, 0.21), MATERIALS["wood"], FURNITURE, parent=root, vertices=12)
    for x in (-width * 0.42, width * 0.42):
        add_box("HP_CHAIR__Arm", (0.055, depth * 0.78, 0.055), (x, 0, 0.62), MATERIALS["wood"], FURNITURE, parent=root, bevel=0.02)


def build_rug(product: dict) -> None:
    root = add_asset_root(product["id"], product["sku"], product["size"], product["placement"])
    size = product["size"]
    add_box("HP_RUG__Body", (size["width"], size["depth"], 0.025), (0, 0, 0.013), MATERIALS["rug"], FURNITURE, parent=root, bevel=0.13)
    add_box("HP_RUG__Inset", (size["width"] * 0.88, size["depth"] * 0.82, 0.009), (0, 0, 0.03), MATERIALS["rug_inset"], FURNITURE, parent=root, bevel=0.12)


def build_lamp(product: dict) -> None:
    root = add_asset_root(product["id"], product["sku"], product["size"], product["placement"])
    height = product["size"]["height"]
    add_cylinder("HP_LAMP__Foot", 0.19, 0.07, (0, 0, 0.035), MATERIALS["sage_dark"], FURNITURE, parent=root)
    add_cylinder("HP_LAMP__Stem", 0.025, height * 0.72, (0, 0, height * 0.36), MATERIALS["sage_dark"], FURNITURE, parent=root, vertices=14)
    add_cylinder("HP_LAMP__Shade", 0.25, 0.31, (0, 0, height * 0.83), MATERIALS["lamp_shade"], FURNITURE, parent=root, scale_xy=(1.0, 1.0), vertices=32)
    add_sphere("HP_LAMP__Cap", (0.1, 0.1, 0.1), (0, 0, height), MATERIALS["wood_light"], FURNITURE, parent=root)


def build_plant(product: dict) -> None:
    root = add_asset_root(product["id"], product["sku"], product["size"], product["placement"])
    height = product["size"]["height"]
    add_cylinder("HP_PLANT__Pot", 0.26, 0.35, (0, 0, 0.175), MATERIALS["blush"], FURNITURE, parent=root, scale_xy=(1.0, 0.9), vertices=24)
    add_cylinder("HP_PLANT__Trunk", 0.045, height * 0.58, (0, 0, 0.35 + height * 0.29), MATERIALS["wood_dark"], FURNITURE, parent=root, vertices=12)
    leaves = [
        (-0.18, -0.02, 0.94), (0.17, 0.03, 1.02), (-0.1, 0.08, 1.18),
        (0.12, -0.06, 1.27), (-0.22, 0.02, 1.36), (0.2, 0.05, 1.45),
        (0, 0, 1.56), (-0.3, 0.08, 1.18), (0.3, -0.04, 1.3),
    ]
    for index, (x, y, z) in enumerate(leaves):
        add_sphere(f"HP_PLANT__Leaf_{index:02d}", (0.36, 0.18, 0.25), (x, y, min(z, height - 0.04)), MATERIALS["sage" if index % 3 else "sage_light"], FURNITURE, parent=root, rotation=(0, math.radians(20 * (index % 4)), math.radians(x * 80)))


def build_shelf(product: dict) -> None:
    root = add_asset_root(product["id"], product["sku"], product["size"], product["placement"])
    width = product["size"]["width"]
    depth = product["size"]["depth"]
    height = product["size"]["height"]
    add_box("HP_SHELF__Back", (width - 0.12, 0.035, height - 0.1), (0, depth / 2 - 0.035, height / 2), MATERIALS["shelf_back"], FURNITURE, parent=root, bevel=0.012)
    for x in (-width / 2 + 0.055, width / 2 - 0.055):
        add_box("HP_SHELF__Side", (0.11, depth, height), (x, 0, height / 2), MATERIALS["wood_light"], FURNITURE, parent=root, bevel=0.035)
    for z in (0.06, height * 0.34, height * 0.66, height - 0.06):
        add_box("HP_SHELF__Shelf", (width, depth, 0.11), (0, 0, z), MATERIALS["wood_light"], FURNITURE, parent=root, bevel=0.035)
    for index, x in enumerate((-0.44, -0.14, 0.18, 0.46)):
        add_box(f"HP_SHELF__Book_{index}", (0.14, depth * 0.56, 0.32 + (index % 2) * 0.06), (x, -0.04, height * 0.47), MATERIALS[["sage", "blush", "blue", "vanilla"][index]], FURNITURE, parent=root, bevel=0.018)


def build_dining_composition() -> None:
    composition = SPEC["diningComposition"]
    table = composition["table"]
    root = add_asset_root(
        "dining-composition-proxy",
        "NON_COMMERCE_SCENE_DRESSING",
        {"width": table["width"], "depth": table["depth"], "height": table["height"]},
        {"x": table["x"], "z": table["z"], "rotationY": 0},
    )
    root["homeplay_role"] = "lifestyle-dressing-root"
    add_box("HP_DINING__TableTop", (table["width"], table["depth"], 0.095), (0, 0, table["height"] - 0.048), MATERIALS["wood_light"], LIFESTYLE, parent=root, bevel=0.09, role="lifestyle-dressing")
    for x in (-table["width"] * 0.4, table["width"] * 0.4):
        for y in (-table["depth"] * 0.34, table["depth"] * 0.34):
            add_cylinder("HP_DINING__TableLeg", 0.032, table["height"] - 0.1, (x, y, (table["height"] - 0.1) / 2), MATERIALS["wood"], LIFESTYLE, parent=root, vertices=12, role="lifestyle-dressing")
    for index, (x, y) in enumerate(composition["chairOffsets"]):
        rotation = math.pi / 2 if abs(x) > 0.8 else 0
        chair_root = bpy.data.objects.new(f"HP_DINING__ChairRoot_{index}", None)
        LIFESTYLE.objects.link(chair_root)
        chair_root.parent = root
        chair_root.location = (x, y, 0)
        chair_root.rotation_euler.z = rotation
        mark_export(chair_root, "lifestyle-dressing")
        add_box("HP_DINING__ChairSeat", (0.42, 0.42, 0.09), (0, 0, 0.43), MATERIALS["sage_light"], LIFESTYLE, parent=chair_root, bevel=0.055, role="lifestyle-dressing")
        add_box("HP_DINING__ChairBack", (0.42, 0.08, 0.37), (0, 0.18, 0.7), MATERIALS["wood_light"], LIFESTYLE, parent=chair_root, bevel=0.045, role="lifestyle-dressing")
        for leg_x in (-0.15, 0.15):
            for leg_y in (-0.15, 0.15):
                add_cylinder("HP_DINING__ChairLeg", 0.023, 0.4, (leg_x, leg_y, 0.2), MATERIALS["wood"], LIFESTYLE, parent=chair_root, vertices=10, role="lifestyle-dressing")


def build_kitchen_proxy() -> None:
    kitchen = SPEC["fixedKitchen"]
    run = kitchen["run"]
    root = bpy.data.objects.new("HP_ARCH__FixedKitchenProxy", None)
    ARCHITECTURE.objects.link(root)
    root.location = to_blender_position(run["x"], 0, run["z"])
    mark_export(root, "fixed-architecture-proxy", kitchen["sourcePage"])
    root["homeplay_status"] = kitchen["status"]
    add_box("HP_KITCHEN__Base", (run["width"], run["depth"], run["counterHeight"]), (0, 0, run["counterHeight"] / 2), MATERIALS["milk"], ARCHITECTURE, parent=root, bevel=0.045, role="fixed-architecture-proxy", source_page=kitchen["sourcePage"])
    add_box("HP_KITCHEN__Counter", (run["width"] + 0.04, run["depth"] + 0.04, 0.055), (0, 0, run["counterHeight"] + 0.028), MATERIALS["counter"], ARCHITECTURE, parent=root, bevel=0.025, role="fixed-architecture-proxy", source_page=kitchen["sourcePage"])
    for y in (-0.9, 0, 0.9):
        add_box("HP_KITCHEN__DoorInset", (0.012, 0.68, 0.55), (run["width"] / 2 + 0.012, y, 0.46), MATERIALS["vanilla"], ARCHITECTURE, parent=root, bevel=0.018, role="fixed-architecture-proxy", source_page=kitchen["sourcePage"])


def build_resident() -> None:
    resident = SPEC["resident"]
    root = add_asset_root(
        resident["id"],
        "HOMEPLAY_ORIGINAL_RESIDENT",
        {"width": 0.82, "depth": 0.7, "height": 1.05},
        resident["placement"],
    )
    root["homeplay_role"] = "original-resident-root"
    add_sphere("HP_RESIDENT__Body", (0.82, 0.66, 0.82), (0, 0, 0.49), MATERIALS["resident_milk"], RESIDENT, parent=root, role="original-resident")
    for index, x in enumerate((-0.29, 0, 0.29)):
        add_sphere(f"HP_RESIDENT__Tuft_{index}", (0.38, 0.34, 0.34), (x, 0, 0.88 + (0.05 if index == 1 else 0)), MATERIALS["resident_milk"], RESIDENT, parent=root, role="original-resident")
    for side in (-1, 1):
        add_sphere(f"HP_RESIDENT__Arm_{side}", (0.2, 0.22, 0.38), (side * 0.42, 0, 0.48), MATERIALS["resident_milk"], RESIDENT, parent=root, rotation=(0, math.radians(side * 12), math.radians(-side * 18)), role="original-resident")
        add_sphere(f"HP_RESIDENT__Foot_{side}", (0.28, 0.3, 0.18), (side * 0.22, 0.02, 0.11), MATERIALS["resident_oat"], RESIDENT, parent=root, role="original-resident")
        add_sphere(f"HP_RESIDENT__Eye_{side}", (0.075, 0.035, 0.095), (side * 0.17, -0.325, 0.61), MATERIALS["cocoa"], RESIDENT, parent=root, role="original-resident")
        add_sphere(f"HP_RESIDENT__Cheek_{side}", (0.18, 0.025, 0.09), (side * 0.29, -0.33, 0.47), MATERIALS["peach"], RESIDENT, parent=root, role="original-resident")
    add_sphere("HP_RESIDENT__Nose", (0.09, 0.04, 0.065), (0, -0.345, 0.54), MATERIALS["cocoa"], RESIDENT, parent=root, role="original-resident")
    add_box("HP_RESIDENT__Pouch", (0.36, 0.12, 0.29), (0.08, -0.34, 0.33), MATERIALS["coral"], RESIDENT, parent=root, rotation_z=math.radians(-6), bevel=0.07, role="original-resident")


def build_lifestyle_props() -> None:
    # All props remain separate from SKU roots and may be hidden in the editor.
    props = [
        ("BookA", (-1.88, -1.82, 0.48), (0.26, 0.18, 0.035), "blue"),
        ("BookB", (-1.84, -1.81, 0.52), (0.23, 0.16, 0.028), "vanilla"),
        ("DiningRunner", (-1.62, 1.42, 0.805), (0.78, 0.28, 0.018), "sage_light"),
    ]
    for name, (x, z, height), size, material_name in props:
        obj = add_box(
            f"HP_PROP__{name}",
            size,
            to_blender_position(x, height, z),
            MATERIALS[material_name],
            LIFESTYLE,
            bevel=min(size) * 0.2,
            role="lifestyle-dressing",
        )
        obj["homeplay_collision"] = False
    add_cylinder("HP_PROP__CoffeeCup", 0.065, 0.095, to_blender_position(-1.54, 0.49, -1.95), MATERIALS["milk"], LIFESTYLE, vertices=24, role="lifestyle-dressing")
    add_cylinder("HP_PROP__DiningVase", 0.07, 0.18, to_blender_position(-1.62, 0.87, 1.42), MATERIALS["blush"], LIFESTYLE, vertices=20, role="lifestyle-dressing")


def configure_camera_and_lighting() -> None:
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.length_unit = "METERS"
    scene.unit_settings.scale_length = 1.0
    available_engines = {item.identifier for item in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items}
    scene.render.engine = "BLENDER_EEVEE" if "BLENDER_EEVEE" in available_engines else "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x, scene.render.resolution_y = SPEC["camera"]["viewport"]
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False
    try:
        scene.view_settings.view_transform = "Standard"
        scene.view_settings.look = "None"
    except Exception:
        pass
    scene.view_settings.exposure = -0.18
    scene.view_settings.gamma = 1.0

    world = bpy.data.worlds.new("HP_NeutralDaylightWorld") if not scene.world else scene.world
    scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = hex_color("#f7f3ee")
    background.inputs["Strength"].default_value = 0.46

    camera_data = bpy.data.cameras.new("HP_Camera_Ortho_A6_Hero")
    camera = bpy.data.objects.new("HP_Camera_Ortho_A6_Hero", camera_data)
    RENDER_RIG.objects.link(camera)
    runtime_position = SPEC["camera"]["position"]
    runtime_target = SPEC["camera"]["target"]
    camera.location = to_blender_position(runtime_position[0], runtime_position[1], runtime_position[2])
    target = Vector(to_blender_position(runtime_target[0], runtime_target[1], runtime_target[2]))
    camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = SPEC["camera"]["orthographicScale"]
    camera_data.lens = 50
    scene.camera = camera

    def area_light(name: str, location: tuple[float, float, float], energy: float, size: float) -> None:
        data = bpy.data.lights.new(name=name, type="AREA")
        data.energy = energy
        data.color = hex_color("#fffdf8")[:3]
        data.shape = "DISK"
        data.size = size
        obj = bpy.data.objects.new(name, data)
        RENDER_RIG.objects.link(obj)
        obj.location = location
        obj.rotation_euler = (Vector((0, 0, 0.6)) - obj.location).to_track_quat("-Z", "Y").to_euler()

    area_light("HP_Light_NeutralWindow", (-4.5, -4.0, 8.5), 430, 7.0)
    area_light("HP_Light_SoftFill", (4.5, 4.0, 6.0), 190, 8.0)

    # Render-only neutral backdrop; excluded from GLB exports.
    add_box("HP_RENDER__Backdrop", (18, 18, 0.08), (0, 0, -0.24), MATERIALS["background"], RENDER_RIG, bevel=0.04, role="render-only")

    # Freestyle supplies the warm, low-contrast picture-book edge treatment.
    # The line is deliberately quiet brown-grey, never pure black.
    try:
        scene.render.use_freestyle = True
        freestyle = bpy.context.view_layer.freestyle_settings
        lineset = freestyle.linesets[0]
        lineset.linestyle.color = hex_color(PALETTE["quietInk"])[:3]
        lineset.linestyle.alpha = 0.68
        lineset.linestyle.thickness = 1.55
        lineset.select_silhouette = True
        lineset.select_border = True
        lineset.select_crease = True
        lineset.select_material_boundary = False
    except Exception as error:
        print(f"Freestyle unavailable: {error}")


def export_selection(filepath: Path, selected: list[bpy.types.Object]) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    for obj in selected:
        obj.hide_viewport = False
        obj.hide_render = False
        obj.select_set(True)
    if selected:
        bpy.context.view_layer.objects.active = selected[0]
    bpy.ops.export_scene.gltf(
        filepath=str(filepath),
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


def descendants(root: bpy.types.Object) -> list[bpy.types.Object]:
    result = [root]
    pending = list(root.children)
    while pending:
        child = pending.pop()
        result.append(child)
        pending.extend(child.children)
    return result


def save_and_export() -> list[dict[str, object]]:
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH), compress=True)
    web_objects = [obj for obj in bpy.context.scene.objects if obj.get("homeplay_export") and obj.get("homeplay_role") != "render-only"]
    export_selection(SCENE_GLB_PATH, web_objects)
    exported = [{"id": "bh7-a6-painterly-pilot", "path": str(SCENE_GLB_PATH.relative_to(ROOT)), "kind": "scene"}]

    for asset_id in ("sofa-cloud", "table-pebble", "chair-breeze", "homeplay-pebble-resident-v1"):
        root = ASSET_ROOTS[asset_id]
        original_location = root.location.copy()
        original_rotation = root.rotation_euler.copy()
        root.location = (0, 0, 0)
        root.rotation_euler = (0, 0, 0)
        bpy.context.view_layer.update()
        asset_path = PUBLIC_DIR / f"{asset_id}-painterly-v1.glb"
        export_selection(asset_path, descendants(root))
        root.location = original_location
        root.rotation_euler = original_rotation
        bpy.context.view_layer.update()
        exported.append({"id": asset_id, "path": str(asset_path.relative_to(ROOT)), "kind": "product" if asset_id != "homeplay-pebble-resident-v1" else "resident"})

    bpy.context.scene.render.filepath = str(RENDER_PATH)
    bpy.ops.render.render(write_still=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH), compress=True)
    return exported


reset_scene()

ARCHITECTURE = new_collection("Architecture_A6_Drawing_Audit")
FURNITURE = new_collection("Furniture_SKU_Painterly")
LIFESTYLE = new_collection("Lifestyle_Dressing")
RESIDENT = new_collection("Original_Resident")
RENDER_RIG = new_collection("Render_Rig_Not_For_GLTF")
ASSET_ROOTS: dict[str, bpy.types.Object] = {}

MATERIALS = {
    "milk": make_material("Milk", PALETTE["milk"]),
    "wall": make_material("Wall_Ivory", "#f3efe6"),
    "floor": make_material("Floor_BleachedOak", "#e4d5bd"),
    "floor_line": make_material("Floor_Seam", "#d5c2a8", 0.98),
    "background": make_material("Background_Neutral", "#f7f3ee", 0.98),
    "vanilla": make_material("Vanilla", PALETTE["vanilla"]),
    "peach": make_material("Peach", PALETTE["peach"]),
    "coral": make_material("Coral", PALETTE["coral"]),
    "sage": make_material("Sage", PALETTE["sage"]),
    "sage_light": make_material("Sage_Light", "#c6d1bb"),
    "sage_dark": make_material("Sage_Dark", "#7f947b"),
    "blue": make_material("Mist_Blue", PALETTE["blue"]),
    "blush": make_material("Blush", PALETTE["blush"]),
    "cocoa": make_material("Cocoa_Line", PALETTE["cocoa"], 0.9),
    "wood": make_material("Wood_Oat", PALETTE["oatmeal"]),
    "wood_light": make_material("Wood_Bleached", "#dec8a8"),
    "wood_dark": make_material("Wood_Detail", "#9c7e64"),
    "window_frame": make_material("Window_Frame", PALETTE["lineBlue"]),
    "door": make_material("Door_Vanilla", "#efd6a2"),
    "counter": make_material("Counter_Matte", "#e9e4dc"),
    "sofa_oat": make_material("Sofa_Oat", "#ded1bf"),
    "sofa_milk": make_material("Sofa_Milk", "#f1e9dc"),
    "chair_cream": make_material("Chair_Cream", "#e8dece"),
    "rug": make_material("Rug_Oat", "#dbcdb9", 0.98),
    "rug_inset": make_material("Rug_Inset", "#eee5d8", 0.98),
    "lamp_shade": make_material("Lamp_Shade", "#f1e5cf"),
    "shelf_back": make_material("Shelf_Back", "#efe9df"),
    "resident_milk": make_material("Resident_Milk", "#f5efe4"),
    "resident_oat": make_material("Resident_Oat", "#dccbb5"),
}

configure_camera_and_lighting()
create_floor()
create_walls()
create_openings()
build_kitchen_proxy()

PRODUCTS = {product["id"]: product for product in SPEC["furniture"]}
build_rug(PRODUCTS["rug-meadow"])
build_sofa(PRODUCTS["sofa-cloud"])
build_table(PRODUCTS["table-pebble"])
build_chair(PRODUCTS["chair-breeze"])
build_lamp(PRODUCTS["lamp-moon"])
build_plant(PRODUCTS["plant-olive"])
build_shelf(PRODUCTS["shelf-cabin"])
build_dining_composition()
build_resident()
build_lifestyle_props()

exported_assets = save_and_export()

report = {
    "schemaVersion": "1.0",
    "candidateVersion": SPEC["candidateVersion"],
    "status": SPEC["status"],
    "blenderVersion": bpy.app.version_string,
    "sourceSpec": str(SPEC_PATH.relative_to(ROOT)),
    "blendFile": str(BLEND_PATH.relative_to(ROOT)),
    "render": str(RENDER_PATH.relative_to(ROOT)),
    "exports": exported_assets,
    "collections": [collection.name for collection in bpy.data.collections],
    "objectCount": len(bpy.context.scene.objects),
    "materialCount": len(bpy.data.materials),
    "humanApprovalRequired": True,
    "knownGate": SPEC["sourceTrace"]["caveat"],
}
REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(report, ensure_ascii=False, indent=2))
