#!/usr/bin/env python3
"""Merge Menagerie OBJ fragments into one lossless MuJoCo MSH per Franka body."""

from pathlib import Path
import struct


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "public" / "models" / "franka" / "assets"

GROUPS = {
    "web_link0.msh": "link0_*.obj",
    "web_link1.msh": "link1.obj",
    "web_link2.msh": "link2.obj",
    "web_link3.msh": "link3_*.obj",
    "web_link4.msh": "link4_*.obj",
    "web_link5.msh": "link5_[0-9].obj",
    "web_link6.msh": "link6_*.obj",
    "web_link7.msh": "link7_*.obj",
    "web_hand.msh": "hand_*.obj",
    "web_finger.msh": "finger_*.obj",
}


def face_vertex(token: str, local_vertex_count: int) -> int:
    index = int(token.split("/", 1)[0])
    return index - 1 if index > 0 else local_vertex_count + index


def build(output_name: str, pattern: str) -> None:
    sources = sorted(
        path for path in ASSET_DIR.glob(pattern)
        if not path.name.startswith("web_") and "collision" not in path.name
    )
    if not sources:
        raise RuntimeError(f"No source meshes matched {pattern}")

    vertices: list[tuple[float, float, float]] = []
    vertex_indices: dict[tuple[float, float, float], int] = {}
    faces: list[tuple[int, int, int]] = []

    for path in sources:
        local_vertices: list[tuple[float, float, float]] = []
        local_faces: list[tuple[int, int, int]] = []
        for line in path.read_text(encoding="utf-8").splitlines():
            if line.startswith("v "):
                x, y, z = line.split()[1:4]
                local_vertices.append((float(x), float(y), float(z)))
            elif line.startswith("f "):
                tokens = line.split()[1:]
                if len(tokens) != 3:
                    raise RuntimeError(f"Expected triangular OBJ faces in {path.name}")
                local_faces.append(tuple(face_vertex(token, len(local_vertices)) for token in tokens))

        local_to_global = []
        for vertex in local_vertices:
            if vertex not in vertex_indices:
                vertex_indices[vertex] = len(vertices)
                vertices.append(vertex)
            local_to_global.append(vertex_indices[vertex])
        faces.extend(tuple(local_to_global[index] for index in face) for face in local_faces)

    header = struct.pack("<4i", len(vertices), 0, 0, len(faces))
    vertex_data = struct.pack(f"<{len(vertices) * 3}f", *(value for vertex in vertices for value in vertex))
    face_data = struct.pack(f"<{len(faces) * 3}i", *(index for face in faces for index in face))
    output = header + vertex_data + face_data
    (ASSET_DIR / output_name).write_bytes(output)
    print(f"{output_name}: {len(sources)} sources -> {len(faces)} faces, {len(output)} bytes")


for name, glob_pattern in GROUPS.items():
    build(name, glob_pattern)
