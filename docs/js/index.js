var TRACKER = new tracking.ObjectTracker(['face']);
var COUNT_FACE = 0;

$("#local_file").change(function() {
    renderImage(this.files[0]);
    $('#result_emotion').html("&nbsp;");
    $('#result_gender').html("&nbsp;");
});

TRACKER.on('track', function(faces) {

    if (faces.data.length == 0) {
        console.log("Face not found");
        swal(
          'แย่จัง',
          'ไม่พบใบหน้า T_T',
          'error'
        );
        return;
    }

    faces.data.forEach(function(rect) {
        var face_id = 'face_' + ++COUNT_FACE;
        //console.log(rect);
        drawFaceFrame(rect);
        cropFace(rect, face_id);

        var result_emotion = getResultEmotion(document.getElementById(face_id), face_id);
        var result_gender = getResultGender(document.getElementById(face_id), face_id);
        generateResultChart(face_id, result_emotion, result_gender);
    });
});

function renderImage(file) {
    var reader = new FileReader();

    reader.onload = function(event) {
        the_url = event.target.result;
        //var html = "<img id='input_img' src='" + the_url + "' style='max-width: 400px'  />";
        $('#show-img').attr("src", the_url);
        clearFaceFrame();
        setTimeout(function(){
            findFaces();
        }, 500);

        //findFaces();
    };
    reader.readAsDataURL(file);
}

function findFaces() {
    tracking.track('#show-img', TRACKER);
}

function clearFaceFrame() {
    $('#image-container .face-frame').remove();
    $('.chart-result').remove();
}

function drawFaceFrame(rect) {
    var container_padding_top = parseInt($('#image-container').css('paddingTop'));
    var container_padding_left = parseInt($('#image-container').css('paddingLeft'));

    var top = rect.y + container_padding_top;
    var left = rect.x + container_padding_left;
    var width = rect.width;
    var height = rect.height;

    var div = $('<div></div>');
    $(div).addClass('face-frame');
    $(div).css({top: top, left: left, width: width, height: height});
    $('#image-container').append(div);
}

function cropFace(rect, face_id) {

    var img = document.getElementById('show-img');

    var x = rect.x
    var y = rect.y;
    var w = rect.width;
    var h = rect.height;

    var ratio = img.naturalWidth / img.width;

    var canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
    canvas.id = face_id;
    canvas.className = "canvas-face";
    canvas.width = 64;
    canvas.height = 64;
    ctx.drawImage(img, x*ratio, y*ratio, w * ratio, h * ratio, 0, 0, 64, 64);

    var canvas_color = document.createElement('canvas');
    ctx_color = canvas_color.getContext('2d');
    canvas_color.id = face_id + '_color';
    canvas_color.className = "canvas-face";
    canvas_color.width = 100;
    canvas_color.height = 100;
    ctx_color.drawImage(img, x*ratio, y*ratio, w * ratio, h * ratio, 0, 0, 100, 100);
    document.body.appendChild(canvas_color);


    //Convert Image to Greyscale
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    for (var i = 0; i < data.length; i += 4) {
        var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i]     = avg; // red
        data[i + 1] = avg; // green
        data[i + 2] = avg; // blue
    }
    ctx.putImageData(imageData, 0, 0);
    document.body.appendChild(canvas)
}

function getResultEmotion(im, face_id) {
    var input = preprocess_input(im);
    var result = predictEmotion(input);
    return result;
}

function getResultGender(im, face_id) {
    var input = preprocess_input(im);
    var result = predictGender(input);
    return result;
}


function generateResultChart(face_id, result_emotion, result_gender) {
    // show card-item-container
    $('#card-item-container').css('visibility', 'visible');

    var chart_emotion_id = face_id + '_emotion_chart';
    var chart_gender_id = face_id + '_gender_chart';
    var html = `
         <div class="col s12 m6 chart-result">
              <div class="card">
                <div class="card-content" style="text-align: center;">
                  <div class="chart-result-profile"><canvas id="` + face_id + `_profile_chart" width="100" height="100"></canvas></div>
                  <div>
                      <canvas id="` + chart_emotion_id + `"></canvas>
                  </div>
                  <div>
                      <canvas id="` + chart_gender_id + `"></canvas>
                  </div>
                </div>
              </div>
          </div>`;
    $('#card-item-container').append(html);

    var canvas_color = document.getElementById(face_id + '_color');
    var ctx_color = canvas_color.getContext("2d");
    var canvas_profile = document.getElementById(face_id + '_profile_chart');
    var ctx_profile = canvas_profile.getContext("2d");
    ctx_profile.drawImage(canvas_color, 0, 0);

    var options = {
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
    var chart_emotion = new Chart(document.getElementById(chart_emotion_id), {
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
                "label":"Emotion: " + result_emotion.label,
                "data": result_emotion.result   ,
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

    var chart_emotion = new Chart(document.getElementById(chart_gender_id), {
        type: 'horizontalBar',
        data: {
          "labels":[
             "Woman",
             "Man",
          ],
          "datasets":[
             {
                "label":"Gender: " + result_gender.label,
                "data": result_gender.result   ,
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
