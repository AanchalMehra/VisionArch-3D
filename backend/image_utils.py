import cv2
from config import MAX_DIM


def load_and_resize(image_path: str):
    """Load image and downscale if larger than MAX_DIM. Returns (img, original_size)."""
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"Image not found: {image_path}")

    h_orig, w_orig = img.shape[:2]

    if max(h_orig, w_orig) > MAX_DIM:
        scale = MAX_DIM / max(h_orig, w_orig)
        img = cv2.resize(img, (int(w_orig * scale), int(h_orig * scale)))

    return img, (w_orig, h_orig)


def build_threshold_mask(img):
    """Build a binary threshold mask combining global and adaptive thresholds."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)

    _, thresh_inv = cv2.threshold(blurred, 200, 255, cv2.THRESH_BINARY_INV)
    thresh_adapt = cv2.adaptiveThreshold(
        blurred, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 21, 10
    )
    return cv2.bitwise_or(thresh_inv, thresh_adapt)