const sharp = require('sharp');

const INPUT_SIZE = 256;

/**
 * Match Python preprocessing:
 * EXIF orientation → RGB → resize 256x256 → float32 pixels (0–255, not normalized)
 */
async function readFileAsImageTensor(buffer, tf) {
  let { data, info } = await sharp(buffer)
    .rotate()
    .resize(INPUT_SIZE, INPUT_SIZE, { fit: 'fill', kernel: sharp.kernel.bilinear })
    .toColorspace('srgb')
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Some pipelines still emit RGBA — strip alpha if needed
  if (info.channels === 4) {
    const rgb = Buffer.alloc(INPUT_SIZE * INPUT_SIZE * 3);
    for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
      rgb[j] = data[i];
      rgb[j + 1] = data[i + 1];
      rgb[j + 2] = data[i + 2];
    }
    data = rgb;
    info = { ...info, channels: 3 };
  }

  // Grayscale → RGB
  if (info.channels === 1) {
    const rgb = Buffer.alloc(INPUT_SIZE * INPUT_SIZE * 3);
    for (let i = 0, j = 0; i < data.length; i += 1, j += 3) {
      rgb[j] = data[i];
      rgb[j + 1] = data[i];
      rgb[j + 2] = data[i];
    }
    data = rgb;
    info = { ...info, channels: 3 };
  }

  if (info.channels !== 3) {
    throw new Error(`Expected 3-channel RGB image, got ${info.channels}`);
  }

  const floatData = Float32Array.from(data);
  return tf.tensor4d(floatData, [1, INPUT_SIZE, INPUT_SIZE, 3]);
}

module.exports = { readFileAsImageTensor, INPUT_SIZE };
