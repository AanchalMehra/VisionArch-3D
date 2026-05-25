from geometry import get_bbox
def is_connector_wall(wall):

    min_x, max_x, min_y, max_y = get_bbox(wall)

    bw = max_x - min_x
    bh = max_y - min_y

    long_side = max(bw, bh)
    short_side = min(bw, bh)

    aspect = long_side / max(short_side, 1)

    # fake connector walls are usually:
    # short + thick/blocky
    return (
        long_side < 50
        and aspect < 2.2
    )

def ensemble_predictions(pred1: list, pred2: list, dist_thresh: int = 45) -> list:
    """
    Fuse two sets of predictions:
      - Both detect same object → prefer segmentation if confidence is close
      - Only one detects it    → keep it
      - Both at same spot, different classes → higher confidence wins
    """
    for p in pred1:
        p["_src"] = "seg"
    for p in pred2:
        p["_src"] = "bbox"

    all_preds = []
    used2 = set()

    for p1 in pred1:
        cls, x1, y1, conf1 = p1["class"], p1["x"], p1["y"], p1["confidence"]
        best_match, best_dist = None, float("inf")

        for i, p2 in enumerate(pred2):
            if p2["class"] != cls:
                continue
            dist = ((x1 - p2["x"]) ** 2 + (y1 - p2["y"]) ** 2) ** 0.5
            if dist < dist_thresh and dist < best_dist:
                best_dist = dist
                best_match = (i, p2)

        if best_match is not None:
            i2, p2 = best_match
            used2.add(i2)
            if "points" in p1 and conf1 >= p2["confidence"] * 0.6:
                all_preds.append(p1)
            elif "points" not in p1 and "points" not in p2:
                all_preds.append(p1 if conf1 >= p2["confidence"] else p2)
            else:
                all_preds.append(p2 if p2["confidence"] > conf1 * 0.6 and "points" in p2 else p1)
        else:
            all_preds.append(p1)

    for i, p2 in enumerate(pred2):
        if i not in used2:
            all_preds.append(p2)

    return all_preds


def deduplicate_openings(preds: list, dist_thresh: int = 30) -> list:
    """Remove window detections that overlap with a door at the same position."""
    doors   = [p for p in preds if p["class"] == "door"]
    windows = [p for p in preds if p["class"] == "window"]
    others  = [p for p in preds if p["class"] not in ("door", "window")]

    filtered_windows = []
    for win in windows:
        too_close = any(
            ((win["x"] - d["x"]) ** 2 + (win["y"] - d["y"]) ** 2) ** 0.5 < dist_thresh
            for d in doors
        )
        if not too_close:
            filtered_windows.append(win)

    return others + doors + filtered_windows


def add_missing_walls(seg_walls: list, bbox_walls: list, img_w: int, img_h: int) -> list:
    """Fill in walls detected only by the bbox model that the segmentation model missed."""
    dist_thresh = max(img_w, img_h) * 0.06
    final_walls = seg_walls.copy()

    for bwall in bbox_walls:
        bx, by = bwall["x"], bwall["y"]
        found = False

        for swall in seg_walls:
            if "points" not in swall:
                continue
            min_x, max_x, min_y, max_y = get_bbox(swall)
            if (bx >= min_x - dist_thresh and bx <= max_x + dist_thresh and
                    by >= min_y - dist_thresh and by <= max_y + dist_thresh):
                found = True
                break

        if not found:
            if bwall.get("width", 0) < 20 and bwall.get("height", 0) < 20:
                continue
            final_walls.append(bwall)

    return final_walls


def snap_doors_to_walls(door_preds: list, wall_preds: list, img_w: int, img_h: int) -> list:
    """Snap each door's center onto the nearest matching wall axis."""
    snapped = []

    for door in door_preds:
        min_x, max_x, min_y, max_y = get_bbox(door)
        dx = (min_x + max_x) / 2
        dy = (min_y + max_y) / 2
        dw, dh = max_x - min_x, max_y - min_y
        door_is_h = dw > dh

        best_wall, best_dist = None, float("inf")

        for wall in wall_preds:
            if is_connector_wall(wall):
                continue
            wx1, wx2, wy1, wy2 = get_bbox(wall)
            wall_w, wall_h = wx2 - wx1, wy2 - wy1
            wall_is_h = wall_w > wall_h

            if wall_is_h != door_is_h:
                continue

            if wall_is_h:
                if dx < wx1 or dx > wx2:
                    continue
                dist = abs(dy - (wy1 + wy2) / 2)
            else:
                if dy < wy1 or dy > wy2:
                    continue
                dist = abs(dx - (wx1 + wx2) / 2)

            if dist < best_dist:
                best_dist = dist
                best_wall = (wx1, wx2, wy1, wy2, wall_is_h)

        if best_wall is None:
            snapped.append(door)
            continue

        wx1, wx2, wy1, wy2, wall_is_h = best_wall
        d = door.copy()
        if wall_is_h:
            d["y"] = (wy1 + wy2) / 2
        else:
            d["x"] = (wx1 + wx2) / 2
        snapped.append(d)

    return snapped

def remove_duplicate_doors(doors, dist_thresh=35):

    filtered = []

    for door in doors:

        keep = True

        for kept in filtered:

            dx = door["x"] - kept["x"]
            dy = door["y"] - kept["y"]

            dist = (dx * dx + dy * dy) ** 0.5

            if dist < dist_thresh:

                # keep higher confidence door
                if door["confidence"] > kept["confidence"]:
                    filtered.remove(kept)
                else:
                    keep = False

                break

        if keep:
            filtered.append(door)

    return filtered