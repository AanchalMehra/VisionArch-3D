import base64
import requests
from config import ROBOFLOW_API_KEY, ROBOFLOW_MODEL1, ROBOFLOW_MODEL2
from cache import load_cache, save_cache


def fetch_predictions(image_path: str) -> tuple[list, list]:
    """Return (pred1, pred2) from Roboflow, using cache if available."""
    cached = load_cache(image_path)
    if cached:
        return cached["rf_1"].get("predictions", []), cached["rf_2"].get("predictions", [])

    with open(image_path, "rb") as f:
        img_base64 = base64.b64encode(f.read()).decode("utf-8")

    rf_1 = requests.post(
        url=f"https://detect.roboflow.com/{ROBOFLOW_MODEL1}",
        params={"api_key": ROBOFLOW_API_KEY, "confidence": 25},
        data=img_base64
    ).json()

    rf_2 = requests.post(
        url=f"https://detect.roboflow.com/{ROBOFLOW_MODEL2}",
        params={"api_key": ROBOFLOW_API_KEY, "confidence": 25},
        data=img_base64
    ).json()

    save_cache(image_path, rf_1, rf_2)
    return rf_1.get("predictions", []), rf_2.get("predictions", [])