const fs = require('fs');
const path = require('path');
const { CROP_CONFIG } = require('./cropConfig');

/**
 * Prefer @tensorflow/tfjs-node (SavedModel support) when native bindings exist
 * (Linux/Render). Fall back to pure @tensorflow/tfjs + Layers model.json.
 */
function createTfRuntime() {
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies, global-require
    const tfNode = require('@tensorflow/tfjs-node');
    if (tfNode?.node?.loadSavedModel) {
      console.log('Using @tensorflow/tfjs-node (SavedModel)');
      return { tf: tfNode, supportsSavedModel: true };
    }
  } catch (err) {
    console.warn('tfjs-node unavailable, using pure tfjs:', err.message);
  }

  // eslint-disable-next-line global-require
  const tf = require('@tensorflow/tfjs');
  console.log('Using @tensorflow/tfjs (Layers model.json only)');
  return { tf, supportsSavedModel: false };
}

const { tf, supportsSavedModel } = createTfRuntime();
const loadedModels = new Map();
let backendReady;

async function ensureBackend() {
  if (!backendReady) {
    backendReady = tf.ready();
  }
  await backendReady;
}

function pathExists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

async function loadModel(cropKey) {
  await ensureBackend();

  if (loadedModels.has(cropKey)) {
    return loadedModels.get(cropKey);
  }

  const config = CROP_CONFIG[cropKey];
  if (!config) {
    throw new Error(`Unknown crop: ${cropKey}`);
  }

  const modelDir = config.path;
  const tfjsCandidates = [
    path.join(modelDir, 'tfjs', 'model.json'),
    path.join(modelDir, 'model.json'),
  ];
  const layersJson = tfjsCandidates.find((p) => pathExists(p));

  let model;
  let type;

  if (layersJson) {
    const fileUrl = `file://${layersJson.replace(/\\/g, '/')}`;
    model = await tf.loadLayersModel(fileUrl);
    type = 'layers';
  } else if (supportsSavedModel && pathExists(path.join(modelDir, 'saved_model.pb'))) {
    model = await tf.node.loadSavedModel(modelDir);
    type = 'savedmodel';
  } else if (supportsSavedModel && pathExists(modelDir)) {
    model = await tf.node.loadSavedModel(modelDir);
    type = 'savedmodel';
  } else {
    throw new Error(
      `No usable model for "${cropKey}" at ${modelDir}. ` +
        'On Render/Linux, SavedModel folders work with tfjs-node. ' +
        'On Windows without tfjs-node, add TF.js files via: python backend/scripts/convert_models.py'
    );
  }

  const entry = { model, type, classes: config.classes };
  loadedModels.set(cropKey, entry);
  return entry;
}

async function runInference(cropKey, imgTensor) {
  const { model, classes } = await loadModel(cropKey);

  const output = tf.tidy(() => {
    const pred = model.predict(imgTensor);
    if (Array.isArray(pred)) {
      return pred[0];
    }
    if (pred && typeof pred === 'object' && !(pred instanceof tf.Tensor)) {
      const values = Object.values(pred);
      return values[0];
    }
    return pred;
  });

  const probabilities = await output.data();
  output.dispose();

  let predictedIndex = 0;
  let maxProb = -Infinity;
  for (let i = 0; i < probabilities.length; i += 1) {
    if (probabilities[i] > maxProb) {
      maxProb = probabilities[i];
      predictedIndex = i;
    }
  }

  const predictedClass = classes[predictedIndex] ?? `class_${predictedIndex}`;
  const allPredictions = {};
  classes.forEach((name, i) => {
    allPredictions[name] = probabilities[i] ?? 0;
  });

  return {
    class: predictedClass,
    confidence: maxProb,
    all_predictions: allPredictions,
  };
}

module.exports = { loadModel, runInference, tf };
