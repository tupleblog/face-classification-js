var MODEL_GENDER;
var IS_MODEL_GENDER_LOADED = false;
initGender = async () => {
  MODEL_GENDER = await tf.loadModel("./model/gender/model.json");
  console.log("Model Gender Loaded");

  //Warm up network
  MODEL_GENDER.predict(tf.zeros([1, 64, 64, 1]));
  IS_MODEL_GENDER_LOADED = true
  M.toast({html: 'Model Gender Loaded.'})
};

initGender();

function predictGender(input) {
  var r = MODEL_GENDER.predict(input);
  var result = r.dataSync();
  var tresult = tf.tensor(result)
  var label_index = tf.argMax(tresult).dataSync()[0]

  var label_percent = result[label_index].toFixed(4) * 100;

  return {"result": result, "label": LABEL_GENDER[label_index], "percent": label_percent};
}
