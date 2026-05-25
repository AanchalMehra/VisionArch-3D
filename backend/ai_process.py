from image_utils import load_and_resize
from roboflow import fetch_predictions
from ensemble import ensemble_predictions, deduplicate_openings,  snap_doors_to_walls, remove_duplicate_doors
from builders import _build_walls, _build_openings
from config import SCENE


def analyze_floorplan(image_path: str) -> dict:

    # 1. Load
    img, (w_orig, h_orig) = load_and_resize(image_path)
    h, w = img.shape[:2]

    # 2. Predict
    pred1, pred2 = fetch_predictions(image_path)
    pred1 = [p for p in pred1 if p["confidence"] > 0.20]
    pred2 = [p for p in pred2 if p["confidence"] > 0.20]

    # 3. Ensemble + remove door/window overlaps
    all_preds = ensemble_predictions(pred1, pred2)
    all_preds = deduplicate_openings(all_preds)

    wall_preds   = [p for p in all_preds if p["class"] == "wall"]
    door_preds   = [p for p in all_preds if p["class"] == "door"]
    window_preds = [p for p in all_preds if p["class"] == "window"]

    # 4. Refine
    bbox_walls = [p for p in pred2 if p["class"] == "wall" and p["confidence"] > 0.20]
    door_preds = snap_doors_to_walls(door_preds, wall_preds, w, h)
    door_preds = remove_duplicate_doors(door_preds)

    # 5. Build 3D
    walls_3d = _build_walls(wall_preds, w, h)
    openings = _build_openings(door_preds, window_preds, w, h)

    print(f"[Pipeline] Walls: {len(walls_3d)} | Doors: {sum(1 for o in openings if o['type'] == 'door')} | Windows: {sum(1 for o in openings if o['type'] == 'window')}")

    return {
        "image_size": {"width": int(w_orig), "height": int(h_orig)},
        "scene_size": SCENE,
        "walls": walls_3d,
        "openings": openings,
        "furniture": [],
        "stats": {
            "walls": len(walls_3d),
            "doors": sum(1 for o in openings if o["type"] == "door"),
            "windows": sum(1 for o in openings if o["type"] == "window"),
        }
    }