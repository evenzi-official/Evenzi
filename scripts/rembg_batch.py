"""
Remove backgrounds from all evezi-3d-images frames using rembg.
Outputs transparent PNGs to public/evezi-3d-images/.
Run from the Evenzi project root.
"""

import sys
import time
from pathlib import Path

try:
    from rembg import new_session, remove
    from PIL import Image
    import io
except ImportError as e:
    print(f"ERROR: {e}\nRun: pip install rembg[cli] pillow")
    sys.exit(1)

INPUT_DIR  = Path("evezi-3d-images")
OUTPUT_DIR = Path("public/evezi-3d-images")

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

frames = sorted(INPUT_DIR.glob("ezgif-frame-*.jpg"))
if not frames:
    print(f"No frames found in {INPUT_DIR}")
    sys.exit(1)

total = len(frames)
print(f"Found {total} frames. Loading model …")

# isnet-general-use: best edge quality; u2netp if you want speed over accuracy
session = new_session("isnet-general-use")

print(f"Processing {total} frames into {OUTPUT_DIR}/\n")
start = time.time()

for i, src in enumerate(frames, 1):
    out_path = OUTPUT_DIR / src.with_suffix(".png").name

    if out_path.exists():
        # Skip already-processed frames (safe to re-run)
        print(f"  [{i:3d}/{total}] skip  {src.name} (exists)", flush=True)
        continue

    img_data = src.read_bytes()
    result   = remove(img_data, session=session, alpha_matting=True,
                      alpha_matting_foreground_threshold=240,
                      alpha_matting_background_threshold=10,
                      alpha_matting_erode_size=10)

    out_path.write_bytes(result)

    elapsed = time.time() - start
    per_img = elapsed / i
    eta     = per_img * (total - i)
    print(f"  [{i:3d}/{total}] done  {src.name} -> {out_path.name}  "
          f"(ETA {eta/60:.1f} min)", flush=True)

print(f"\nAll done in {(time.time()-start)/60:.1f} min.")
