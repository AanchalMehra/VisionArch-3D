import hashlib
import json
import os


def get_cache_path(image_path: str) -> str:
    with open(image_path, "rb") as f:
        file_hash = hashlib.md5(f.read()).hexdigest()
    return f"/tmp/rf_cache_{file_hash}.json"


def load_cache(image_path: str):
    cache_path = get_cache_path(image_path)
    if os.path.exists(cache_path):
        with open(cache_path) as f:
            return json.load(f)
    return None


def save_cache(image_path: str, rf_1: dict, rf_2: dict) -> None:
    cache_path = get_cache_path(image_path)
    with open(cache_path, "w") as f:
        json.dump({"rf_1": rf_1, "rf_2": rf_2}, f)