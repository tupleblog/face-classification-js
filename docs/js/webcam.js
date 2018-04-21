var WEBCAM = document.getElementById('webcam');
var FACE_FRAME = document.getElementById('webcam_frame');
var CANVAS_FRAME = document.getElementById('canvas_webcam');
var CANVAS_FRAME_CTX = CANVAS_FRAME.getContext('2d');
var CANVAS_FACE = document.getElementById('face_profile_chart');
var CANVAS_FACE_CTX = CANVAS_FACE.getContext('2d');
var CANVAS_FACE_GREY = document.getElementById('face_profile_greyscale');
var CANVAS_FACE_GREY_CTX = CANVAS_FACE_GREY.getContext('2d');
var CHART_EMOTION;
var CHART_GENDER;
var TRACKER = new tracking.ObjectTracker(['face']);

$(document).ready(function() {

    tracking.track('#webcam', TRACKER, { camera: true });
    setTimeout(function(){ setCanvasFrameSize(); }, 3000);
    initChart();
});



TRACKER.on('track', function(faces) {

    CANVAS_FRAME_CTX.clearRect(0, 0, CANVAS_FRAME.width, CANVAS_FRAME.height);

    if (faces.data.length == 0) {
        return;
    }

    //console.log(faces.data);
    drawFaceFrame(faces.data[0]);
    cropFace(faces.data[0]);

    var result_emotion = getResultEmotion(CANVAS_FACE_GREY);
    var result_gender = getResultGender(CANVAS_FACE_GREY);
    updateResultChart(result_emotion, result_gender);
});

function setCanvasFrameSize() {

    var w = $('#webcam').width();
    var h = $('#webcam').height();
    CANVAS_FRAME.width = w;
    CANVAS_FRAME.height = h;
}

function drawFaceFrame(rect) {

    CANVAS_FRAME_CTX.strokeStyle = '#a64ceb';
    CANVAS_FRAME_CTX.strokeRect(rect.x, rect.y, rect.width, rect.height);
}

function cropFace(rect) {

    var x = rect.x
    var y = rect.y;
    var w = rect.width;
    var h = rect.height;

    var w_w = $(WEBCAM).width();
    var w_h = $(WEBCAM).height();
    var video_w = WEBCAM.videoWidth;
    var video_h = WEBCAM.videoHeight;

    var ratio = video_w / w_w;
    //console.log(ratio);

    CANVAS_FACE_CTX.drawImage(WEBCAM, x*ratio, y*ratio, w * ratio, h * ratio, 0, 0, 64, 64);

    //Convert Image to Greyscale
    var imageData = CANVAS_FACE_CTX.getImageData(0, 0, CANVAS_FACE.width, CANVAS_FACE.height);
    var data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
        var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i]     = avg; // red
        data[i + 1] = avg; // green
        data[i + 2] = avg; // blue
    }
    CANVAS_FACE_GREY_CTX.putImageData(imageData, 0, 0);
}

function getResultEmotion(im) {
    var input = preprocess_input(im);
    var result = predictEmotion(input);
    return result;
}

function getResultGender(im) {
    var input = preprocess_input(im);
    var result = predictGender(input);
    return result;
}

function updateResultChart(result_emotion, result_gender) {
    //console.log(result_emotion);
    //console.log(result_gender);
    CHART_GENDER.data.datasets[0].data = result_gender.result;
    CHART_GENDER.update();

    CHART_EMOTION.data.datasets[0].data = result_emotion.result;
    CHART_EMOTION.update();
}

function initChart() {
    var options = {
        /*"animation": false,*/
        "responsive": true,
        "maintainAspectRatio": false,
        "scales":{
           "xAxes":[
              {
                 "ticks":{
                    "beginAtZero":true
                 }
              }
           ]
        }
     };

    CHART_EMOTION = new Chart(document.getElementById('chart_emotion'), {
        type: 'horizontalBar',
        data: {
          "labels":[
             "Angry",
             "Disgust",
             "Fear",
             "Happy",
             "Sad",
             "Surprise",
             "Neutral"
          ],
          "datasets":[
             {
                "label":"Emotion: ",
                "data": [0, 0, 0, 0, 0, 0, 0],
                "fill": false,
                "backgroundColor":[
                   "rgba(255, 99, 132, 0.2)",
                   "rgba(255, 159, 64, 0.2)",
                   "rgba(255, 205, 86, 0.2)",
                   "rgba(75, 192, 192, 0.2)",
                   "rgba(54, 162, 235, 0.2)",
                   "rgba(153, 102, 255, 0.2)",
                   "rgba(201, 203, 207, 0.2)"
                ],
                "borderColor":[
                   "rgb(255, 99, 132)",
                   "rgb(255, 159, 64)",
                   "rgb(255, 205, 86)",
                   "rgb(75, 192, 192)",
                   "rgb(54, 162, 235)",
                   "rgb(153, 102, 255)",
                   "rgb(201, 203, 207)"
                ],
                "borderWidth":1
             }
          ]
       },
        options: options
    });

    CHART_GENDER = new Chart(document.getElementById('chart_gender'), {
        type: 'horizontalBar',
        data: {
          "labels":[
             "Woman",
             "Man",
          ],
          "datasets":[
             {
                "label":"Gender: ",
                "data": [0, 0],
                "fill": false,
                "backgroundColor":[
                   "rgba(255, 99, 132, 0.2)",
                   "rgba(75, 192, 192, 0.2)",
                ],
                "borderColor":[
                   "rgb(255, 99, 132)",
                   "rgb(75, 192, 192)",
                ],
                "borderWidth":1
             }
          ]
       },
        options: options
    });

}