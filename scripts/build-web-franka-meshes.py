#!/usr/bin/env python3
"""Merge Menagerie OBJ fragments into one lossless visual mesh per Franka body."""

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "public" / "models" / "franka" / "assets"

GROUPS = {
    "web_link0.obj": "link0_*.obj",
    "web_link1.obj": "link1.obj",
    "web_link2.obj": "link2.obj",
    "web_link3.obj": "link3_*.obj",
    "web_link4.obj": "link4_*.obj",
    "web_link5.obj": "link5_[0-9].obj",
    "web_link6.obj": "link6_*.obj",
    "web_link7.obj": "link7_*.obj",
    "web_hand.obj": "hand_*.obj",
    "web_finger.obj": "finger_*.obj",
}


def face_vertex(token: str, local_vertex_count: int) -> int:
    index = int(token.split("/", 1)[0])
    return index if index > 0 else local_vertex_count + index + 1


def build(output_name: str, pattern: str) -> None:
    sources = sorted(
        path for path in ASSET_DIR.glob(pattern)
        if not path.name.startswith("web_") and "collision" not in path.name
    )
    if not sources:
        raise RuntimeError(f"No source meshes matched {pattern}")

    vertices: list[str] = []
    faces: list[tuple[int, int, int]] = []
    vertex_offset = 0

    for path in sources:
        local_vertices: list[str] = []
        local_faces: list[tuple[int, int, int]] = []
        for line in path.read_text(encoding="utf-8").splitlines():
            if line.startswith("v "):
                local_vertices.append(line)
            elif line.startswith("f "):
                tokens = line.split()[1:]
                if len(tokens) != 3:
                    raise RuntimeError(f"Expected triangular OBJ faces in {path.name}")
                local_faces.append(tuple(face_vertex(token, len(local_vertices)) for token in tokens))

        vertices.extend(local_vertices)
        faces.extend(tuple(index + vertex_offset for index in face) for face in local_faces)
        vertex_offset += len(local_vertices)

    output = ["# Lossless merged Franka web visual", *vertices]
    output.extend(f"f {first} {second} {third}" for first, second, third in faces)
    (ASSET_DIR / output_name).write_text("\n".join(output) + "\n", encoding="utf-8")
    print(f"{output_name}: {len(sources)} sources -> {len(faces)} faces")


for name, glob_pattern in GROUPS.items():
    build(name, glob_pattern)
