var MODEL_EMOTION;
initEmotion = async () => {
  MODEL_EMOTION = await tf.loadModel("./model/emotion/model.json");
  console.log("Model Emotion Loaded");

  //Warm up network
  MODEL_EMOTION.predict(tf.zeros([1, 64, 64, 1]));
};

initEmotion();

function predictEmotion(input) {
  var r = MODEL_EMOTION.predict(input);
  var result = r.dataSync();
  var tresult = tf.tensor(result)
  var label_index = tf.argMax(tresult).dataSync()[0]

  var label_percent = result[label_index].toFixed(4) * 100;

  return {"result": result, "label": LABEL_EMOTIONS[label_index], "percent": label_percent};
}
