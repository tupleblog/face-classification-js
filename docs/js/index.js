var TRACKER = new tracking.ObjectTracker(['face']);
var COUNT_FACE = 0;
var COUNT_TRY_DETECT_FACE = 0;
var MODEL_READY_CHECKER;
var CROPPER;
var CROPPER_IMG;

//TRACKER.setEdgesDensity(0.2);
//TRACKER.setInitialScale(1);
//TRACKER.setStepSize(1.5);

$(document).ready(function() {
    $('#input_url').change(function() {
        COUNT_TRY_DETECT_FACE = 0;
        renderImageUrl($(this).val(), false);
    });

    $('#btn-share').click(onBtnShareClicked);
    $('#btn-manual').click(enableManualCrop);

    MODEL_READY_CHECKER = setInterval(function(){
        if (IS_MODEL_EMOTION_LOADED && IS_MODEL_GENDER_LOADED) {
            clearInterval(MODEL_READY_CHECKER);
            console.log("Model Ready");
            // Auto fill url
            var u = new URL(window.location.href);
            var url = u.searchParams.get("url");
            if (url != null) {
                $('#input_url').val(url).trigger('change');
            }

            var share_url = u.searchParams.get("share_url");
            if (share_url != null) {
                var decode_url = atob(share_url);
                $('#input_url').val(decode_url).trigger('change');
            }

        }

    }, 1000);


});


$("#local_file").change(function() {
    $('#btn-share').hide();
    $('#input_url').val('');
    COUNT_TRY_DETECT_FACE = 0;
    renderImage(this.files[0]);
    $('#result_emotion').html("&nbsp;");
    $('#result_gender').html("&nbsp;");
});

TRACKER.on('track', function(faces) {
    COUNT_TRY_DETECT_FACE++;

    if (faces.data.length == 0 && COUNT_TRY_DETECT_FACE == 1) {
        //Try to detect face again
        console.log('Try to detect face again: params-1')
        TRACKER.setEdgesDensity(0.1);
        tracking.track('#show-img', TRACKER);
        return;
    } else if (faces.data.length == 0 && COUNT_TRY_DETECT_FACE == 2) {
        console.log('Try to detect face again: params-2');
        TRACKER.setEdgesDensity(0.1);
        TRACKER.setInitialScale(4);
        TRACKER.setStepSize(1);
        tracking.track('#show-img', TRACKER);
        return;
    }

    resetTrackerParam();

    if (faces.data.length == 0) {
        console.log("Face not found");
        swal(
          'Sorry',
          'We couldn\'t identify the face T_T<br /> Try manually crop the face.',
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

function resetTrackerParam() {
    TRACKER.setEdgesDensity(0.2);
    TRACKER.setInitialScale(1);
    TRACKER.setStepSize(1.5);
}

function renderImageUrl(url, showError) {
    if (url.length == 0) {
        $('#btn-share').hide();
        return;
    }

    disableManualCrop();
    $('#image-loading').show();
    var img = new Image;
    img.crossOrigin = "Anonymous";
    img.onload = function(){
        $('#btn-share').show();
        $('#image-loading').hide();
        $('#card-item-container').css('visibility', 'visible');
        $('#btn-manual').show();
        console.log('Image Loaded');
        document.getElementById("show-img").src = this.src;
        clearFaceFrame();
        findFaces();
    };
    img.onerror = function() {
        $('#image-loading').hide();
        if (showError == false) {
            renderImageUrlProxy(url);
            return;
        }
        swal(
          'แย่จัง',
          'ไม่สามารถโหลดภาพนี้ได้',
          'error'
        );
    };

    img.src = url;
}

function renderImageUrlProxy(url) {
    var proxy_url = 'https://cors-anywhere.herokuapp.com/' + url;
    renderImageUrl(proxy_url, true);
}

function renderImage(file) {
    var reader = new FileReader();

    reader.onload = function(event) {
        disableManualCrop();
        $('#card-item-container').css('visibility', 'visible');
        $('#btn-manual').show();
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
    $('.canvas-face').remove();
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

function onBtnShareClicked() {
    var input_url = $('#input_url').val();
    //TODO: validate is url
    if (input_url.length == 0) {
        return;
    }

    var share_url = generateShareUrl(input_url);
    var html = `
    <div class="row">
       <div class="input-field col s12">
         <input placeholder="Placeholder" id="first_name" type="text" value="` + share_url  + `">
       </div>
     </div>
    `;

    swal({
      title: 'Share this result',
      html: html,
      showCloseButton: true,
    });

}

function generateShareUrl(input_url) {

    var share_url = 'https://tupleblog.github.io/face-classification-js/index.html?share_url=';
    //share_url = btoa(pako.deflate(input_url, { to: 'string' }));
    share_url += btoa(input_url);
    return share_url;
}

function disableManualCrop() {
  $('#show-img').cropper('destroy');
}

function enableManualCrop() {
  clearFaceFrame();
  CROPPER_IMG = $('#show-img');
  CROPPER_IMG.cropper({
    aspectRatio: 1,
    zoomable: false,
    minCropBoxWidth: 32,
    minCropBoxHeight: 32,
    ready: function () {
      console.log('build');
      CROPPER_IMG.cropper("setCropBoxData", { width: 124, height: 124 });
    },
    cropend: function(event) {
      console.log('cropend');
      clearFaceFrame();
      var rect = CROPPER.getData();
      var face_id = 'face_1';
      cropFace(rect, face_id);

      var result_emotion = getResultEmotion(document.getElementById(face_id), face_id);
      var result_gender = getResultGender(document.getElementById(face_id), face_id);
      generateResultChart(face_id, result_emotion, result_gender);
    }
  });
  CROPPER = CROPPER_IMG.data('cropper');

}

function generateResultChart(face_id, result_emotion, result_gender) {
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

    if (typeof generateResultChartTrigger == 'function') {
        generateResultChartTrigger(face_id);
    }
}
