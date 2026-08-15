"""
Build inference-only models (no RandomFlip/RandomRotation) and convert to TF.js Graph.

Usage (from project root):
  python backend/scripts/convert_models.py
"""

from __future__ import annotations

import os
import sys
import types

import numpy as np

if not hasattr(np, "object"):
    np.object = object  # type: ignore[attr-defined]
if not hasattr(np, "bool"):
    np.bool = bool  # type: ignore[attr-defined]

import tensorflow as tf

if not hasattr(tf.compat.v1, "estimator"):
    tf.compat.v1.estimator = types.SimpleNamespace(Exporter=type("Exporter", (), {}))

hub_stub = types.ModuleType("tensorflow_hub")
hub_stub.LatestModuleExporter = type("LatestModuleExporter", (), {})
sys.modules["tensorflow_hub"] = hub_stub

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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

AUGMENT_TYPES = {
    "RandomFlip",
    "RandomRotation",
    "RandomZoom",
    "RandomContrast",
    "RandomTranslation",
    "RandomHeight",
    "RandomWidth",
    "RandomCrop",
}


def find_source(folder: str, stem: str) -> str | None:
    base = os.path.join(BASE_DIR, folder)
    for name in (f"{stem}.h5", f"{stem}.keras"):
        path = os.path.join(base, name)
        if os.path.isfile(path):
            return path
    return None


def is_augmentation_block(layer) -> bool:
    if type(layer).__name__ in AUGMENT_TYPES:
        return True
    if hasattr(layer, "layers"):
        names = {type(l).__name__ for l in layer.layers}
        if names & AUGMENT_TYPES:
            return True
    return False


def build_inference_model(model: tf.keras.Model) -> tf.keras.Model:
    """Drop data-augmentation blocks; keep resize/rescale + CNN head."""
    inputs = tf.keras.Input(shape=(256, 256, 3), name="image")
    x = inputs
    for layer in model.layers:
        if is_augmentation_block(layer):
            continue
        x = layer(x)
    return tf.keras.Model(inputs, x, name=f"{model.name}_inference")


def main() -> int:
    try:
        from tensorflowjs.converters import tf_saved_model_conversion_v2 as conv
    except Exception as err:
        print("Failed to import tensorflowjs:", err)
        return 1

    converted = 0
    for folder, stem in MODEL_JOBS:
        src = find_source(folder, stem)
        if not src:
            print(f"Skip {folder}/{stem}: no .h5/.keras found")
            continue

        print(f"Loading {src}")
        model = tf.keras.models.load_model(src, compile=False)
        inference = build_inference_model(model)

        saved_dir = os.path.join(BASE_DIR, folder, stem, "inference_saved")
        tfjs_dir = os.path.join(BASE_DIR, folder, stem, "tfjs")
        os.makedirs(saved_dir, exist_ok=True)
        os.makedirs(tfjs_dir, exist_ok=True)

        # Keras 3 export → SavedModel without augmentation
        inference.export(saved_dir)
        print(f"  Exported inference SavedModel -> {saved_dir}")

        conv.convert_tf_saved_model(saved_dir, tfjs_dir)
        print(f"  TF.js graph model -> {tfjs_dir}")
        converted += 1

    print(f"Done. Converted {converted} model(s).")
    return 0 if converted else 1


if __name__ == "__main__":
    sys.exit(main())
