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
    //Get Time for files' Name.
    Date.prototype.format = function (format) {
        var o = {
            "M+": this.getMonth() + 1, //month
            "d+": this.getDate(), //day
            "h+": this.getHours(), //hour
            "m+": this.getMinutes(), //minute
            "s+": this.getSeconds(), //second
            /*"q+": Math.floor((this.getMonth() + 3) / 3), //quarter
            "S": this.getMilliseconds() //millisecond*/
        }
        if (/(y+)/.test(format)) format = format.replace(RegExp.$1,
            (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(format))
                format = format.replace(RegExp.$1,
                    RegExp.$1.length == 1 ? o[k] :
                    ("00" + o[k]).substr(("" + o[k]).length));
        return format;
    }

    const T = new Date();
    T.format('yyyy-MM-dd');
    //Save Sequence as Vodeo
    const blob = new Blob(recordedBlobs, {
        type: 'video/webm'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'Sequence ' + T + '.webm';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);

    //Save Sensor Date as .txt
    const R = rotVec;
    const A = AccVec;
    const O = OriVec;
    const TiSt = TsVec;
    
    const times = new Blob(TiSt, {
        type: "text/plain;charset=utf-8"
    });
    saveAs(times, "TimeStamp  " + T + ".txt");
    
    const rot = new Blob(R, {
        type: "text/plain;charset=utf-8"
    });
    saveAs(rot, "Rotation  " + T + ".txt");
    const acc = new Blob(A, {
        type: "text/plain;charset=utf-8"
    });
    saveAs(acc, "Acceleration  " + T + ".txt");
    const ori = new Blob(O, {
        type: "text/plain;charset=utf-8"
    });
    saveAs(ori, "orientation  " + T + ".txt");

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
    accelerometer.stop();
    gyroscope.stop();
    orientator.stop();
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
var TsVec = [];
let accelerometer;
let gyroscope;
let orientator;

function StartSensor() {
    ////////////////////////////////////////////////////////////////
    var AccVec = [];
    var rotVec = [];
    var OriVec = [];
    var TsVec = [];
    //----------------- Orientation Sensor -------------- //

    function deviceOrientationHandler(eventData) {
        var tiltLR = eventData.gamma;
        var tiltFB = eventData.beta;
        var dir = eventData.alpha;
        var info, xyz = "[t, X, Y, Z]";

        document.getElementById("doTiltLR").innerHTML = Math.round(tiltLR);
        document.getElementById("doTiltFB").innerHTML = Math.round(tiltFB);
        document.getElementById("doDirection").innerHTML = Math.round(dir);

        var logo = document.getElementById("imgLogo");
        logo.style.webkitTransform = "rotate(" + tiltLR + "deg) rotate3d(1,0,0, " + (tiltFB * -1 + 90) + "deg)";
        logo.style.MozTransform = "rotate(" + tiltLR + "deg) rotate3d(1,0,0, " + (tiltFB * -1 + 90) + "deg)";
        logo.style.transform = "rotate(" + tiltLR + "deg) rotate3d(1,0,0, " + (tiltFB * -1 + 90) + "deg)";
    }
    //----------------Motion Sensors (IMU) ---------------- //
    function OrientationHandler(orientation, OV) {
        let info, abcd = "[A, B, C, D]";
        let Q = orientation.quaternion;

        info = abcd.replace("A", Q[0].toFixed(3));
        info = info.replace("B", Q[1].toFixed(3));
        info = info.replace("C", Q[2].toFixed(3));
        info = info.replace("D", Q[3].toFixed(3));
        document.getElementById("orSen").innerHTML = info;
        OV.push(info);
    }

    function accelerationHandler(acceleration, AV) {
        var info, xyz = "[X, Y, Z]";
        
        info = xyz.replace("X", acceleration.x && acceleration.x.toFixed(3));
        info = info.replace("Y", acceleration.y && acceleration.y.toFixed(3));
        info = info.replace("Z", acceleration.z && acceleration.z.toFixed(3));
        document.getElementById('moAccel').innerHTML = info;
        AV.push(info);
        /*document.getElementById('AccSequence').innerHTML = AV;*/
    }

    function rotationHandler(rotation, RV) {
        var info, xyz = "[X, Y, Z]";
        info = xyz.replace("X", rotation.alpha && rotation.alpha.toFixed(3));
        info = info.replace("Y", rotation.beta && rotation.beta.toFixed(3));
        info = info.replace("Z", rotation.gamma && rotation.gamma.toFixed(3));
        document.getElementById("moRotation").innerHTML = info;
        RV.push(info);
    }

    /*function intervalHandler(interval) {
        document.getElementById("moInterval").innerHTML = interval;
    }*/

    if ('LinearAccelerationSensor' in window && 'Gyroscope' in window && 'DeviceOrientationEvent' in window && 'AbsoluteOrientationSensor' in window) {
        document.getElementById('moApi').innerHTML = 'Motion Sensor detected';
        window.addEventListener('deviceorientation', deviceOrientationHandler, false);
        accelerometer = new LinearAccelerationSensor({
            frequency: 30
        });
        gyroscope = new Gyroscope({
            frequency: 30
        });
        orientator = new AbsoluteOrientationSensor({
            frequency: 30
        });

        /*document.addEventListener('load', e => {
            
        });*/

        accelerometer.addEventListener('reading', e => {
            let current = Date.now() / 1000;
            document.getElementById("timeStamp").innerHTML = current;
            TsVec.push(current + ', ');
            accelerationHandler(accelerometer, AccVec);
        });

        gyroscope.addEventListener('reading', e => rotationHandler({
            alpha: gyroscope.x,
            beta: gyroscope.y,
            gamma: gyroscope.z
        }, rotVec));

        orientator.addEventListener('reading', e => OrientationHandler(orientator, OriVec));

        accelerometer.start();
        gyroscope.start();
        orientator.start();

    } else if ('DeviceMotionEvent' in window) {
        document.getElementById('moApi').innerHTML = 'Device Motion Event';

        var onDeviceMotion = function (eventData) {
            accelerationHandler(eventData.acceleration, 'moAccel');
            rotationHandler(eventData.rotationRate);
            intervalHandler(eventData.interval);
        }

        window.addEventListener('devicemotion', onDeviceMotion, false);
    } else {
        document.getElementById('logoContainer').innerText = 'Device Orientation API not supported.';
        document.getElementById('moApi').innerHTML = 'No Sensors API available';
        document.getElementById("moRotation").innerHTML = '[x,y,z]';
    }
}
