const path = require('path');

const BASE_DIR = path.join(__dirname, '..', '..');

/**
 * Each crop points at a folder containing a TensorFlow.js Layers model
 * (model.json + weight shards). Convert from .keras/.h5 with:
 *   python backend/scripts/convert_models.py
 */
const CROP_CONFIG = {
  potato: {
    path: path.join(BASE_DIR, 'models', '1'),
    classes: ['Potato___Early_blight', 'Potato___Late_blight', 'Potato___healthy'],
  },
  pepper: {
    path: path.join(BASE_DIR, 'models1', '2'),
    classes: ['Pepper__bell___Bacterial_spot', 'Pepper__bell___healthy'],
  },
  tomato: {
    path: path.join(BASE_DIR, 'models2', '3'),
    classes: [
      'Tomato_Bacterial_spot',
      'Tomato_Early_blight',
      'Tomato_Late_blight',
      'Tomato_Leaf_Mold',
      'Tomato_Septoria_leaf_spot',
      'Tomato_Spider_mites_Two_spotted_spider_mite',
      'Tomato__Target_Spot',
      'Tomato__Tomato_YellowLeaf__Curl_Virus',
      'Tomato__Tomato_mosaic_virus',
      'Tomato_healthy',
    ],
  },
  maize: {
    path: path.join(BASE_DIR, 'models3', '4'),
    classes: [
      'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot',
      'Corn_(maize)___Common_rust_',
      'Corn_(maize)___Northern_Leaf_Blight',
      'Corn_(maize)___healthy',
    ],
  },
  apple: {
    path: path.join(BASE_DIR, 'models4', '5'),
    classes: [
      'Apple___Apple_scab',
      'Apple___Black_rot',
      'Apple___Cedar_apple_rust',
      'Apple___healthy',
    ],
  },
  wheat: {
    path: path.join(BASE_DIR, 'models5', '6'),
    classes: [
      'Wheat__brown_rust',
      'Wheat__healthy',
      'Wheat__septoria',
      'Wheat__yellow_rust',
    ],
  },
  rice: {
    path: path.join(BASE_DIR, 'models6', '7'),
    classes: [
      'Rice__brown_spot',
      'Rice__healthy',
      'Rice__hispa',
      'Rice__leaf_blast',
      'Rice__neck_blast',
    ],
  },
  mango: {
    path: path.join(BASE_DIR, 'models7', '8'),
    classes: [
      'anthracnose',
      'die_black',
      'gall_midge',
      'healthy',
      'powdery_mildew',
    ],
  },
  sugarcane: {
    path: path.join(BASE_DIR, 'models8', '9'),
    classes: ['Healthy', 'Mosaic', 'RedRot', 'Rust', 'Yellow'],
  },
  finger_millet: {
    path: path.join(BASE_DIR, 'models9', '10'),
    classes: ['downy', 'healthy', 'mottle', 'seedling', 'smut', 'wilt'],
  },
};

function getCropKey(crop) {
  const key = String(crop || 'potato').toLowerCase();
  return Object.prototype.hasOwnProperty.call(CROP_CONFIG, key) ? key : 'potato';
}

module.exports = { CROP_CONFIG, getCropKey, BASE_DIR };
