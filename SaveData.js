'use strict';
/* globals MediaRecorder */

const mediaSource = new MediaSource();
mediaSource.addEventListener('sourceopen', handleSourceOpen, false);
let mediaRecorder;
let recordedBlobs;
let sourceBuffer;

const errorMsgElement = document.querySelector('span#errorMsg');
const recordedVideo = document.querySelector('video#recorded');
const recordButton = document.querySelector('button#record');


recordButton.addEventListener('click', () => {
    if (recordButton.textContent === 'Start Recording') {
        startRecording();
        StartSensor();

    } else {
        stopRecording();
        recordButton.textContent = 'Start Recording';
        playButton.disabled = false;
        downloadButton.disabled = false;
    }
});

const playButton = document.querySelector('button#play');
playButton.addEventListener('click', () => {
    const superBuffer = new Blob(recordedBlobs, {
        type: 'video/webm'
    });
    recordedVideo.src = null;
    recordedVideo.srcObject = null;
    recordedVideo.src = window.URL.createObjectURL(superBuffer);
    recordedVideo.controls = true;
    recordedVideo.play();
});

const downloadButton = document.querySelector('button#download');
downloadButton.addEventListener('click', () => {
    const blob = new Blob(recordedBlobs, {
        type: 'video/webm'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'test.webm';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);

    const R = rotVec;
    const A = AccVec;
    const O = OriVec;

    const rot = new Blob(R, {
        type: "text/plain;charset=utf-8"
    });
    saveAs(rot, "Rotation.txt");
    const acc = new Blob(A, {
        type: "text/plain;charset=utf-8"
    });
    saveAs(acc, "Acceleration.txt");
    const ori = new Blob(O, {
        type: "text/plain;charset=utf-8"
    });
    saveAs(ori, "orientation.txt");

});

function handleSourceOpen(event) {
    console.log('MediaSource opened');
    sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
    console.log('Source buffer: ', sourceBuffer);
}

function handleDataAvailable(event) {
    if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);
    }
}

function startRecording() {
    recordedBlobs = [];
    let options = {
        mimeType: 'video/webm;codecs=vp9'
    };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.error(`${options.mimeType} is not Supported`);
        errorMsgElement.innerHTML = `${options.mimeType} is not Supported`;
        options = {
            mimeType: 'video/webm;codecs=vp8'
        };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.error(`${options.mimeType} is not Supported`);
            errorMsgElement.innerHTML = `${options.mimeType} is not Supported`;
            options = {
                mimeType: 'video/webm'
            };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.error(`${options.mimeType} is not Supported`);
                errorMsgElement.innerHTML = `${options.mimeType} is not Supported`;
                options = {
                    mimeType: ''
                };
            }
        }
    }

    try {
        mediaRecorder = new MediaRecorder(window.stream, options);
    } catch (e) {
        console.error('Exception while creating MediaRecorder:', e);
        errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
        return;
    }

    console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
    recordButton.textContent = 'Stop Recording';
    playButton.disabled = true;
    downloadButton.disabled = true;
    mediaRecorder.onstop = (event) => {
        console.log('Recorder stopped: ', event);
    };
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start(10); // collect 10ms of data
    console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
    mediaRecorder.stop();
    console.log('Recorded Blobs: ', recordedBlobs);
}

function handleSuccess(stream) {
    recordButton.disabled = false;
    console.log('getUserMedia() got stream:', stream);
    window.stream = stream;

    const gumVideo = document.querySelector('video#gum');
    gumVideo.srcObject = stream;
}

async function init(constraints) {
    try {
        const hasEchoCancellation = document.querySelector('#echoCancellation').checked;
        const constraints = {
            audio: {
                echoCancellation: {
                    exact: hasEchoCancellation
                }
            },
            video: {
                width: 640,
                height: 480
            }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        handleSuccess(stream);
    } catch (e) {
        console.error('navigator.getUserMedia error:', e);
        errorMsgElement.innerHTML = `navigator.getUserMedia error:${e.toString()}`;
    }
}

var AccVec = [];
var rotVec = [];
var OriVec = [];
function StartSensor() {
    ////////////////////////////////////////////////////////////////
    AccVec = [];
    rotVec = [];
    OriVec = [];
    //----------------- Orientation Sensor -------------- //
    if ('DeviceOrientationEvent' in window && 'AbsoluteOrientationSensor' in window) {
        window.addEventListener('deviceorientation', deviceOrientationHandler, false);
    } else {
        document.getElementById('logoContainer').innerText = 'Device Orientation API not supported.';
    }

    function deviceOrientationHandler(eventData) {
        var tiltLR = eventData.gamma;
        var tiltFB = eventData.beta;
        var dir = eventData.alpha;
        var info, xyz = "[t, X, Y, Z]";

        info = xyz.replace("t", Date.now()/1000);
        info = info.replace("X", Math.round(tiltLR));
        info = info.replace("Y", Math.round(tiltFB));
        info = info.replace("Z", Math.round(dir));
        document.getElementById('orSen').innerHTML = info;
        OriVec.push(info);

        document.getElementById("doTiltLR").innerHTML = Math.round(tiltLR);
        document.getElementById("doTiltFB").innerHTML = Math.round(tiltFB);
        document.getElementById("doDirection").innerHTML = Math.round(dir);

        var logo = document.getElementById("imgLogo");
        logo.style.webkitTransform = "rotate(" + tiltLR + "deg) rotate3d(1,0,0, " + (tiltFB * -1) + "deg)";
        logo.style.MozTransform = "rotate(" + tiltLR + "deg) rotate3d(1,0,0, " + (tiltFB * -1) + "deg)";
        logo.style.transform = "rotate(" + tiltLR + "deg) rotate3d(1,0,0, " + (tiltFB * -1) + "deg)";
    }
    //----------------Motion Sensors (IMU) ---------------- //
    /*function deviceOrientationHandler(orientation, OV, t) {
      var tiltLR = orientation.gamma;
      var tiltFB = orientation.beta;
      var dir = orientation.alpha;
      var info, xyz = "[t, X, Y, Z]";
      
      info = xyz.replace("t", t);
      info = info.replace("X", Math.round(tiltLR));
      info = info.replace("Y", Math.round(tiltFB));
      info = info.replace("Z", Math.round(dir));
      document.getElementById('orSen').innerHTML = info;
      OV.push(info);
        
      document.getElementById("doTiltLR").innerHTML = Math.round(tiltLR);
      document.getElementById("doTiltFB").innerHTML = Math.round(tiltFB);
      document.getElementById("doDirection").innerHTML = Math.round(dir);

      var logo = document.getElementById("imgLogo");
      logo.style.webkitTransform = "rotate(" + tiltLR + "deg) rotate3d(1,0,0, " + (tiltFB * -1) + "deg)";
      logo.style.MozTransform = "rotate(" + tiltLR + "deg)";
      logo.style.transform = "rotate(" + tiltLR + "deg) rotate3d(1,0,0, " + (tiltFB * -1) + "deg)";
    }*/

    function accelerationHandler(acceleration, AV, t) {
        var info, xyz = "[t, X, Y, Z]";
        info = xyz.replace("t", t);
        info = info.replace("X", acceleration.x && acceleration.x.toFixed(3));
        info = info.replace("Y", acceleration.y && acceleration.y.toFixed(3));
        info = info.replace("Z", acceleration.z && acceleration.z.toFixed(3));
        document.getElementById('moAccel').innerHTML = info;
        AV.push(info);
        /*document.getElementById('AccSequence').innerHTML = AV;*/
    }

    function rotationHandler(rotation, RV, t) {
        var info, xyz = "[t, X, Y, Z]";
        info = xyz.replace("t", t);
        info = info.replace("X", rotation.alpha && rotation.alpha.toFixed(3));
        info = info.replace("Y", rotation.beta && rotation.beta.toFixed(3));
        info = info.replace("Z", rotation.gamma && rotation.gamma.toFixed(3));
        document.getElementById("moRotation").innerHTML = info;
        RV.push(info);
        /*document.getElementById('RotSequence').innerHTML = RV;*/
    }

    function intervalHandler(interval) {
        document.getElementById("moInterval").innerHTML = interval;
    }

    if ('LinearAccelerationSensor' in window && 'Gyroscope' in window) {
        document.getElementById('moApi').innerHTML = 'Motion Sensor detected';
        let lastReadingTimestamp;
        let accelerometer = new LinearAccelerationSensor({
            frequency: 30
        });
        let gyroscope = new Gyroscope({
            frequency: 30
        });
        /*let orientator = new AbsoluteOrientationSensor({});*/

        /*document.addEventListener('load', e => {
            
        });*/

        accelerometer.addEventListener('reading', e => {
            if (lastReadingTimestamp) {
                intervalHandler(Math.round(accelerometer.timestamp - lastReadingTimestamp));
            }
            lastReadingTimestamp = accelerometer.timestamp;

            document.getElementById("timeStamp").innerHTML = accelerometer.timestamp;
            accelerationHandler(accelerometer, AccVec, Date.now()/1000);
        });

        gyroscope.addEventListener('reading', e => rotationHandler({
            alpha: gyroscope.x,
            beta: gyroscope.y,
            gamma: gyroscope.z
        }, rotVec, Date.now()/1000));

        /*orientator.addEventListener('reading', e => deviceOrientationHandler(orientator, OriVec, orientator.timestamp));*/

        accelerometer.start();
        gyroscope.start();
        /*orientator.start();*/

    } else if ('DeviceMotionEvent' in window) {
        document.getElementById('moApi').innerHTML = 'Device Motion Event';

        var onDeviceMotion = function (eventData) {
            accelerationHandler(eventData.acceleration, 'moAccel');
            accelerationHandler(eventData.accelerationIncludingGravity, 'moAccelGrav');
            rotationHandler(eventData.rotationRate);
            intervalHandler(eventData.interval);
        }

        window.addEventListener('devicemotion', onDeviceMotion, false);
    } else {
        document.getElementById('moApi').innerHTML = 'No Sensors API available';
        document.getElementById("moRotation").innerHTML = '[x,y,z]';
    }
}
