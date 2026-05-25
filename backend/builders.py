import math
import cv2
import numpy as np

from config import SCENE, WALL_HEIGHT,WALL_THICKNESS, DOOR_HEIGHT, DOOR_WIDTH, WINDOW_HEIGHT
from geometry import normalize, snap, get_bbox

CORNER_OVERLAP = 0.11


def _get_wall_angle(pred: dict) -> float:
    """
    Returns Y rotation in radians for a wall prediction.
    Uses minAreaRect on segmentation points for accurate angle.
    Falls back to 0 for bbox predictions (axis-aligned).
    """
    if "points" not in pred:
        return 0.0

    pts = pred["points"]
    if len(pts) < 2:
        return 0.0

    coords = np.array([[p["x"], p["y"]] for p in pts], dtype=np.float32)
    _, (rw, rh), angle = cv2.minAreaRect(coords)

    # minAreaRect returns angle in [-90, 0]
    # if the rect is wider than tall, angle is the tilt from horizontal
    if rw < rh:
        angle += 90  # rotate to align with long axis

    return math.radians(angle)


def _is_diagonal(angle_rad: float, threshold_deg: float = 15.0) -> bool:
    """Returns True if angle is meaningfully off axis (not horizontal/vertical)."""
    deg = math.degrees(angle_rad) % 180
    normalized = min(deg, 180 - deg)  # 0 = horizontal, 90 = vertical
    off_axis = min(normalized, 90 - normalized)  # 0 = on-axis, 45 = fully diagonal
    return off_axis > threshold_deg


def _build_walls(wall_preds: list, w: int, h: int) -> list:
    walls_3d = []

    for wall in wall_preds:
        min_x, max_x, min_y, max_y = get_bbox(wall)
        bw, bh = max_x - min_x, max_y - min_y
        cx, cy = (min_x + max_x) / 2, (min_y + max_y) / 2

        # Skip tiny noise
        if bw < 17 and bh < 17:
            continue

        aspect = max(bw, bh) / max(min(bw, bh), 1)

        # Filter large boxy shapes (furniture) but allow small boxy walls
        is_large = max(bw, bh) > 80
        is_boxy  = aspect < 2.0
        if is_large and is_boxy:
            continue

        # Get rotation angle
        angle_rad = _get_wall_angle(wall)
        diagonal  = _is_diagonal(angle_rad)

        if diagonal:
            # Use long side of bounding box as wall length
            long_side = max(bw, bh)
            thickness = WALL_THICKNESS
            width = normalize(long_side, w) + CORNER_OVERLAP * 2
            depth = thickness
            rotation_y = angle_rad
        else:
            # Axis-aligned wall
            if "points" in wall and aspect < 1.5:
                continue

            horizontal = bw > bh
            thickness  = WALL_THICKNESS
            width = normalize(bw, w) if horizontal else thickness
            depth = thickness if horizontal else normalize(bh, h)
            rotation_y = 0.0

            # Extend ends to close corner gaps
            if horizontal:
                width += CORNER_OVERLAP * 2
            else:
                depth += CORNER_OVERLAP * 2

        if width < 0.08 and depth < 0.08:
            continue

        walls_3d.append({
            "id": f"wall_{len(walls_3d)}",
            "type": "wall",
            "position": [
                normalize(cx, w) - (SCENE / 2),
                WALL_HEIGHT / 2,
                normalize(cy, h) - (SCENE / 2),
            ],
            "size": [width, WALL_HEIGHT, depth],
            "rotation": [0, round(rotation_y, 4), 0],
        })

    return walls_3d[:80]


def _build_openings(door_preds: list, window_preds: list, w: int, h: int) -> list:
    openings = []

    for door in door_preds:
        min_x, max_x, min_y, max_y = get_bbox(door)
        bw, bh = max_x - min_x, max_y - min_y
        cx, cy = (min_x + max_x) / 2, (min_y + max_y) / 2
        horizontal = bw > bh

        openings.append({
            "type": "door",
            "horizontal": horizontal,
            "position": [
                snap(normalize(cx, w) - (SCENE / 2)),
                0,
                snap(normalize(cy, h) - (SCENE / 2)),
            ],
            "size": [DOOR_WIDTH if horizontal else 0.12, DOOR_HEIGHT, 0.12 if horizontal else DOOR_WIDTH],
            "rotation": [0, 0, 0],
        })

    for window in window_preds:
        min_x, max_x, min_y, max_y = get_bbox(window)
        bw, bh = max_x - min_x, max_y - min_y
        cx, cy = (min_x + max_x) / 2, (min_y + max_y) / 2
        horizontal = bw > bh

        openings.append({
            "type": "window",
            "horizontal": horizontal,
            "position": [
                snap(normalize(cx, w) - (SCENE / 2)),
                0.6,
                snap(normalize(cy, h) - (SCENE / 2)),
            ],
            "size": [snap(normalize(bw, w)) if horizontal else 0.12, WINDOW_HEIGHT, 0.12 if horizontal else snap(normalize(bh, h))],
            "rotation": [0, 0, 0],
        })

    return openings[:50]