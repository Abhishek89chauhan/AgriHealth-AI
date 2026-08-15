const sharp = require('sharp');

const INPUT_SIZE = 256;

/**
 * Match Python preprocessing:
 * EXIF orientation → RGB → resize 256x256 → float32 pixels (0–255, not normalized)
 */
async function readFileAsImageTensor(buffer, tf) {
  const { data, info } = await sharp(buffer)
    .rotate()
    .ensureAlpha(0)
    .removeAlpha()
    .resize(INPUT_SIZE, INPUT_SIZE, { fit: 'fill', kernel: sharp.kernel.bilinear })
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.channels !== 3) {
    throw new Error(`Expected 3-channel RGB image, got ${info.channels}`);
  }

  // data is Uint8Array of length 256*256*3
  const floatData = Float32Array.from(data);
  return tf.tensor4d(floatData, [1, INPUT_SIZE, INPUT_SIZE, 3]);
}

module.exports = { readFileAsImageTensor, INPUT_SIZE };
