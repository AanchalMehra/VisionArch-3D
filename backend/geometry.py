from config import SCENE


def normalize(px: float, dim: float) -> float:
    """Normalize a pixel coordinate to scene units."""
    return round(float((px / dim) * SCENE), 4)


def snap(v: float, step: float = 0.25) -> float:
    """Snap a value to the nearest grid step."""
    return round(v / step) * step


def get_bbox(pred: dict) -> tuple[float, float, float, float]:
    """Return (min_x, max_x, min_y, max_y) from a segmentation or bbox prediction."""
    if "points" in pred:
        xs = [p["x"] for p in pred["points"]]
        ys = [p["y"] for p in pred["points"]]
        return min(xs), max(xs), min(ys), max(ys)
    cx, cy = pred["x"], pred["y"]
    hw, hh = pred["width"] / 2, pred["height"] / 2
    return cx - hw, cx + hw, cy - hh, cy + hh