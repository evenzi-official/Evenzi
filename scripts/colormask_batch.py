"""
Fast, clean background removal for the Evenzi mascot frames.
Uses precise colour-distance masking — the background is a perfectly uniform
solid grey, so this produces far sharper results than AI-based removal.

Run from the Evenzi project root:
  python scripts/colormask_batch.py
"""

import sys
from pathlib import Path

try:
    import numpy as np
    from PIL import Image
except ImportError:
    print("ERROR: pip install pillow numpy")
    sys.exit(1)

INPUT_DIR  = Path("evezi-3d-images")
OUTPUT_DIR = Path("public/evezi-3d-images")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

frames = sorted(INPUT_DIR.glob("ezgif-frame-*.jpg"))
if not frames:
    print(f"No frames found in {INPUT_DIR}")
    sys.exit(1)

# Sample the background colour from the top-left corner of frame 001.
# It's a solid render background so a single pixel is enough.
sample = np.array(Image.open(frames[0]).convert("RGB"))
BG_COLOR = sample[0, 0].astype(float)           # e.g. [232, 232, 232]
print(f"Background colour sampled: RGB{tuple(BG_COLOR.astype(int))}")

# Pixels whose Euclidean distance from BG_COLOR is < HARD are fully transparent.
# Between HARD and SOFT we ramp alpha smoothly (handles JPEG antialiasing noise).
HARD = 18   # fully transparent threshold
SOFT = 38   # fully opaque threshold

total = len(frames)
print(f"Processing {total} frames ...\n")

for i, src in enumerate(frames, 1):
    out_path = OUTPUT_DIR / src.with_suffix(".png").name

    img  = Image.open(src).convert("RGBA")
    data = np.array(img, dtype=np.float32)

    # Euclidean distance of every pixel from the background colour
    rgb  = data[:, :, :3]
    dist = np.sqrt(np.sum((rgb - BG_COLOR) ** 2, axis=2))  # shape (H, W)

    # Smooth alpha ramp: 0 at HARD, 255 at SOFT
    alpha = np.clip((dist - HARD) / (SOFT - HARD) * 255, 0, 255).astype(np.uint8)

    result = np.array(img)
    result[:, :, 3] = alpha

    Image.fromarray(result).save(out_path, "PNG", optimize=False)

    if i % 30 == 0 or i == total:
        print(f"  [{i:3d}/{total}] {src.name}")

print("\nAll done.")
