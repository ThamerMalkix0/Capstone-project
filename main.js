 function captureFrame() {
        // Get a reference to the video element
        var video = document.getElementById('video');

        // Get a reference to the canvas element
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');

        // Set canvas dimensions to match video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the current frame of the video onto the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert the canvas content to a data URL representing the image
        var dataURL = canvas.toDataURL('image/png');

        // Store the data URL in local storage


        localStorage.setItem('capturedImage', dataURL);


        // Display the captured screenshot
        displayCapturedImage(dataURL);

        // Clean up: remove the canvas element
        canvas.remove();
    }

    function displayCapturedImage(dataURL) {
        // Create an image element to display the screenshot
        var img = document.createElement('img');
        img.src = dataURL;

        // Append the image to the screenshot container
        var container = document.getElementById('capturedImageContainer');
        container.appendChild(img);
    }

// monitoring function
$(function () {
    const video = $("video")[0];

    var model;
    var cameraMode = "environment"; // or "user"


    const startVideoStreamPromise = navigator.mediaDevices
        .getUserMedia({
            audio: false,
            video: {
                facingMode: cameraMode
            }
        })

        .then(function (stream) {
            return new Promise(function (resolve) {
                video.srcObject = stream;
                video.onloadeddata = function () {
                    video.play();
                    resolve();
                };
            });
        });

    var publishable_key = "rf_B4IVl1TewfayjQAaUgdieudRIhZ2";
    var toLoad = {
        model: "offline-exam-monitoring-4",
        version: 2
    };

    const loadModelPromise = new Promise(function (resolve, reject) {
        roboflow.auth({
                publishable_key: publishable_key
            })
            .load(toLoad)
            .then(function (m) {
                model = m;
                resolve();
            });
    });

    Promise.all([startVideoStreamPromise, loadModelPromise]).then(function () {
        $("body").removeClass("loading");
        resizeCanvas();
        detectFrame();
    });


    var canvas, ctx;
    const font = "bold 16px Arial";
    function videoDimensions(video) {
        // Ratio of the video's intrisic dimensions
        var videoRatio = video.videoWidth / video.videoHeight;
        // The width and height of the video element
        var width = video.offsetWidth,
            height = video.offsetHeight;
        // The ratio of the element's width to its height
        var elementRatio = width / height;
        if (elementRatio > videoRatio) { // If the video element is short and wide
            width = height * videoRatio;
        } else {
            // It must be tall and thin, or exactly equal to the original ratio
            height = width / videoRatio;
        }
        return {
            width: width,
            height: height
        };
    }


    $(window).resize(function () {
        resizeCanvas();
    });
    const resizeCanvas = function () {
        $("canvas").remove();
        canvas = $("<canvas/>");
        ctx = canvas[0].getContext("2d");
        var dimensions = videoDimensions(video);
        console.log(
            video.videoWidth,
            video.videoHeight,
            video.offsetWidth,
            video.offsetHeight,
            dimensions
        );
        canvas[0].width = video.videoWidth;
        canvas[0].height = video.videoHeight;
        canvas.css({
            width: dimensions.width,
            height: dimensions.height,
            left: ($(window).width() - dimensions.width) / 2,
            top: ($(window).height() - dimensions.height) / 2
        });
        $("body").append(canvas);
    };
    const renderPredictions = function (predictions) {
        var dimensions = videoDimensions(video);
        var scale = 1;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        predictions.forEach(function (prediction) {
            const x = prediction.bbox.x;
            const y = prediction.bbox.y;
            const width = prediction.bbox.width;
            const height = prediction.bbox.height;
            ctx.strokeStyle = prediction.color; // Draw the bounding box.
            ctx.lineWidth = 4;
            ctx.strokeRect(
                (x - width / 2) / scale,
                (y - height / 2) / scale,
                width / scale,
                height / scale
            );
            ctx.fillStyle = prediction.color; // Draw the label background.
            const textWidth = ctx.measureText(prediction.class).width;
            const textHeight = parseInt(font, 10); // base 10
            ctx.fillRect(
                (x - width / 2) / scale,
                (y - height / 2) / scale,
                textWidth + 8,
                textHeight + 4
            );
        });

        predictions.forEach(function (prediction) {
            const x = prediction.bbox.x;
            const y = prediction.bbox.y;
            const width = prediction.bbox.width;
            const height = prediction.bbox.height;
            const confidence = prediction.confidence; // Accessing confidence value
            ctx.font = font; // Draw the text and confidence percentage last to ensure they are on top.
            ctx.textBaseline = "top";
            ctx.fillStyle = "#000000";
            ctx.globalAlpha = confidence;
            const className = prediction.class;

            if (className == 'Cheating') {
                 captureFrame();
            }
            const confidenceText = (confidence * 100).toFixed(2) + '%';
            const text = `${className} (${confidenceText})`; // Combine class name and confidence value
            const textWidth = ctx.measureText(text).width; // Measure text width
            ctx.fillText(
                text,
                (x - textWidth / 2) / scale, // Center text horizontally
                (y - height / 2) / scale - 10, // Position text above the bounding box
                width / scale // optional fourth argument for maxWidth
            );
        });
    };

    const detectFrame = function () {
    if (!model) return requestAnimationFrame(detectFrame); // Retry after 5 seconds if model is not ready

    model
        .detect(video)
        .then(function (predictions) {
            renderPredictions(predictions);

            // Schedule the next detection after 5 seconds
            setTimeout(detectFrame, 5000);
        })
        .catch(function (e) {
            console.log("Error during detection:", e);
            // Retry detection after 5 seconds
            requestAnimationFrame(detectFrame);
        });
    };
});