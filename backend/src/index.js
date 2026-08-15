const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { getCropKey } = require('./cropConfig');
const { readFileAsImageTensor } = require('./imageService');
const { runInference, tf } = require('./modelService');

const app = express();
const PORT = process.env.PORT || 8000;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image uploads are allowed'));
      return;
    }
    cb(null, true);
  },
});

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['*'],
  })
);

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Plant Disease Detection API',
    endpoints: {
      health: 'GET /ping',
      predict: 'POST /predict (multipart: file, crop)',
    },
  });
});

app.get('/ping', (_req, res) => {
  res.type('text/plain').send('Hello, I am alive');
});

app.post('/predict', upload.single('file'), async (req, res) => {
  let imgTensor;

  try {
    if (!req.file || !req.file.buffer) {
      res.status(400).json({ error: 'Missing image file. Send multipart field "file".' });
      return;
    }

    const cropKey = getCropKey(req.body?.crop);
    imgTensor = await readFileAsImageTensor(req.file.buffer, tf);
    const result = await runInference(cropKey, imgTensor);

    res.json({
      class: result.class,
      confidence: result.confidence,
      crop: cropKey,
      all_predictions: result.all_predictions,
    });
  } catch (err) {
    console.error('Predict error:', err);
    res.status(500).json({
      error: err.message || 'Prediction failed',
    });
  } finally {
    if (imgTensor) {
      imgTensor.dispose();
    }
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 400).json({ error: err.message || 'Request failed' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Plant disease API listening on http://0.0.0.0:${PORT}`);
});
