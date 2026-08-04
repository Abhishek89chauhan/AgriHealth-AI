from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
from io import BytesIO
from PIL import Image, ImageOps
import tensorflow as tf
import os
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Limit TensorFlow thread usage for faster startup and predictable inference on CPU
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
tf.config.threading.set_intra_op_parallelism_threads(2)
tf.config.threading.set_inter_op_parallelism_threads(2)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_executor = ThreadPoolExecutor(max_workers=2)
_loaded_models = {}

CROP_CONFIG = {
    "potato": {
        "path": os.path.join(BASE_DIR, "models", "1.keras"),
        "classes": ["Potato___Early_blight", "Potato___Late_blight", "Potato___healthy"],
        "compile": True,
    },
    "pepper": {
        "path": os.path.join(BASE_DIR, "models1", "2.keras"),
        "classes": ["Pepper__bell___Bacterial_spot", "Pepper__bell___healthy"],
        "compile": True,
    },
    "tomato": {
        "path": os.path.join(BASE_DIR, "models2", "3.h5"),
        "classes": [
            "Tomato_Bacterial_spot",
            "Tomato_Early_blight",
            "Tomato_Late_blight",
            "Tomato_Leaf_Mold",
            "Tomato_Septoria_leaf_spot",
            "Tomato_Spider_mites_Two_spotted_spider_mite",
            "Tomato__Target_Spot",
            "Tomato__Tomato_YellowLeaf__Curl_Virus",
            "Tomato__Tomato_mosaic_virus",
            "Tomato_healthy",
        ],
        "compile": False,
    },
    "maize": {
        "path": os.path.join(BASE_DIR, "models3", "4.h5"),
        "classes": [
            "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
            "Corn_(maize)___Common_rust_",
            "Corn_(maize)___Northern_Leaf_Blight",
            "Corn_(maize)___healthy",
        ],
        "compile": False,
    },
    "apple": {
        "path": os.path.join(BASE_DIR, "models4", "5.h5"),
        "classes": [
            "Apple___Apple_scab",
            "Apple___Black_rot",
            "Apple___Cedar_apple_rust",
            "Apple___healthy",
        ],
        "compile": False,
    },
    "wheat": {
        "path": os.path.join(BASE_DIR, "models5", "6.h5"),
        "classes": [
            "Wheat__brown_rust",
            "Wheat__healthy",
            "Wheat__septoria",
            "Wheat__yellow_rust",
        ],
        "compile": False,
    },
    "rice": {
        "path": os.path.join(BASE_DIR, "models6", "7.h5"),
        "classes": [
            "Rice__brown_spot",
            "Rice__healthy",
            "Rice__hispa",
            "Rice__leaf_blast",
            "Rice__neck_blast",
        ],
        "compile": False,
    },
    "mango": {
        "path": os.path.join(BASE_DIR, "models7", "8.h5"),
        "classes": [
            "anthracnose",
            "die_black",
            "gall_midge",
            "healthy",
            "powdery_mildew",
        ],
        "compile": False,
    },
    "sugarcane": {
        "path": os.path.join(BASE_DIR, "models8", "9.h5"),
        "classes": ["Healthy", "Mosaic", "RedRot", "Rust", "Yellow"],
        "compile": False,
    },
    "finger_millet": {
        "path": os.path.join(BASE_DIR, "models9", "10.h5"),
        "classes": ["downy", "healthy", "mottle", "seedling", "smut", "wilt"],
        "compile": False,
    },
}


def get_crop_key(crop: str) -> str:
    key = crop.lower()
    return key if key in CROP_CONFIG else "potato"


def load_model(crop_key: str):
    if crop_key in _loaded_models:
        return _loaded_models[crop_key]

    config = CROP_CONFIG[crop_key]
    load_kwargs = {"compile": config["compile"]}
    model = tf.keras.models.load_model(config["path"], **load_kwargs)
    _loaded_models[crop_key] = model
    return model


def read_file_as_image(data) -> np.ndarray:
    image = Image.open(BytesIO(data))
    image = ImageOps.exif_transpose(image)

    if image.mode != "RGB":
        image = image.convert("RGB")

    # BILINEAR is faster than LANCZOS and sufficient at 256x256 for model input
    image = image.resize((256, 256), Image.Resampling.BILINEAR)
    return np.array(image, dtype=np.float32)


def run_inference(model, img_batch: np.ndarray) -> np.ndarray:
    # Direct call is faster than model.predict() for single-image inference
    return model(img_batch, training=False).numpy()[0]


@app.get("/ping")
async def ping():
    return "Hello, I am alive"


@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    crop: str = Form("potato"),
):
    crop_key = get_crop_key(crop)
    class_names = CROP_CONFIG[crop_key]["classes"]
    image_bytes = await file.read()

    loop = asyncio.get_running_loop()
    image = await loop.run_in_executor(_executor, read_file_as_image, image_bytes)
    img_batch = np.expand_dims(image, 0)

    model = await loop.run_in_executor(_executor, load_model, crop_key)
    predictions = await loop.run_in_executor(
        _executor, run_inference, model, img_batch
    )

    predicted_index = int(np.argmax(predictions))
    predicted_class = class_names[predicted_index]
    confidence = float(predictions[predicted_index])

    all_preds = {name: float(predictions[i]) for i, name in enumerate(class_names)}

    return {
        "class": predicted_class,
        "confidence": confidence,
        "crop": crop_key,
        "all_predictions": all_preds,
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
