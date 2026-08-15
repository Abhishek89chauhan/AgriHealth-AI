"""
One-time converter: Keras (.keras / .h5) → TensorFlow.js Layers model.

Requires (Python):
  pip install tensorflow tensorflowjs

Usage (from project root):
  python backend/scripts/convert_models.py
"""

from __future__ import annotations

import os
import sys

# Compatibility shim for tensorflowjs on newer NumPy (np.object / np.bool removed)
import numpy as np

if not hasattr(np, "object"):
    np.object = object  # type: ignore[attr-defined]
if not hasattr(np, "bool"):
    np.bool = bool  # type: ignore[attr-defined]

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Prefer .h5 when both exist; output TF.js into the numbered folder
MODEL_JOBS = [
    ("models", "1"),
    ("models1", "2"),
    ("models2", "3"),
    ("models3", "4"),
    ("models4", "5"),
    ("models5", "6"),
    ("models6", "7"),
    ("models7", "8"),
    ("models8", "9"),
    ("models9", "10"),
]


def find_source(folder: str, stem: str) -> str | None:
    base = os.path.join(BASE_DIR, folder)
    for name in (f"{stem}.h5", f"{stem}.keras"):
        path = os.path.join(base, name)
        if os.path.isfile(path):
            return path
    return None


def main() -> int:
    try:
        import tensorflow as tf
        import tensorflowjs as tfjs
    except ImportError:
        print("Install converter deps: pip install tensorflow tensorflowjs")
        return 1

    converted = 0
    for folder, stem in MODEL_JOBS:
        src = find_source(folder, stem)
        if not src:
            print(f"Skip {folder}/{stem}: no .h5/.keras found")
            continue

        out_dir = os.path.join(BASE_DIR, folder, stem)
        # Write TF.js beside SavedModel files into a tfjs subfolder to avoid clobbering
        tfjs_dir = os.path.join(out_dir, "tfjs")
        os.makedirs(tfjs_dir, exist_ok=True)

        print(f"Converting {src} -> {tfjs_dir}")
        model = tf.keras.models.load_model(src, compile=False)
        tfjs.converters.save_keras_model(model, tfjs_dir)
        print(f"  OK: {os.path.join(tfjs_dir, 'model.json')}")
        converted += 1

    if not converted:
        print("No .keras/.h5 source files found under models*/.")
        return 1

    print(f"Done. Converted {converted} model(s).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
