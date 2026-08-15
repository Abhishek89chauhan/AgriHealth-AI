const fs = require('fs');
const path = require('path');
const tf = require('@tensorflow/tfjs');
const { CROP_CONFIG } = require('./cropConfig');

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

/**
 * Load TF.js Graph/Layers models from disk without fetch/file://
 * (Node's fetch does not support local files).
 */
function fileSystemHandler(modelJsonPath) {
  const modelDir = path.dirname(modelJsonPath);

  return {
    async load() {
      const modelConfig = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));
      const weightSpecs = [];
      const buffers = [];

      for (const group of modelConfig.weightsManifest || []) {
        for (const spec of group.weights) {
          weightSpecs.push(spec);
        }
        for (const weightPath of group.paths) {
          buffers.push(fs.readFileSync(path.join(modelDir, weightPath)));
        }
      }

      const weightData = Buffer.concat(buffers).buffer;

      return {
        modelTopology: modelConfig.modelTopology,
        weightSpecs,
        weightData,
        format: modelConfig.format,
        generatedBy: modelConfig.generatedBy,
        convertedBy: modelConfig.convertedBy,
        signature: modelConfig.signature,
        userDefinedMetadata: modelConfig.userDefinedMetadata,
      };
    },
  };
}

function isGraphModelJson(modelJsonPath) {
  try {
    const parsed = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));
    return parsed.format === 'graph-model' || Array.isArray(parsed.modelTopology?.node);
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
  const candidates = [
    path.join(modelDir, 'tfjs', 'model.json'),
    path.join(modelDir, 'model.json'),
  ];
  const modelJson = candidates.find((p) => pathExists(p));

  if (!modelJson) {
    throw new Error(
      `TF.js model not found for "${cropKey}" at ${path.join(modelDir, 'tfjs', 'model.json')}. ` +
        'Run: python backend/scripts/convert_models.py'
    );
  }

  const handler = fileSystemHandler(modelJson);
  const graph = isGraphModelJson(modelJson);
  const model = graph
    ? await tf.loadGraphModel(handler)
    : await tf.loadLayersModel(handler);

  console.log(`Loaded ${cropKey} (${graph ? 'graph' : 'layers'}) from ${modelJson}`);
  const entry = { model, graph, classes: config.classes };
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
