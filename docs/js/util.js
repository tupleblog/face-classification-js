var LABEL_EMOTIONS = {0:'Angry', 1:'Disgust', 2:'Fear', 3:'Happy', 4:'Sad', 5:'Surprise', 6:'Neutral'};
var LABEL_GENDER = {0:'Woman', 1:'Man'};

function preprocess_input(im) {
  img = tf.fromPixels(im, 1).toFloat()
  offset = tf.scalar(255);
  x1 = tf.scalar(0.5);
  x2 = tf.scalar(2);
  normalized = img.div(offset).sub(x1).mul(x2);
  batched = normalized.reshape([1, 64, 64, 1]);

  return batched;
}
