
function preprocess_input(im) {
  img = tf.fromPixels(im, 1).toFloat()
  offset = tf.scalar(255);
  x1 = tf.scalar(0.5);
  x2 = tf.scalar(2);
  normalized = img.div(offset).sub(x1).mul(x2);
  batched = normalized.reshape([1, 64, 64, 1]);

  return batched;
}
