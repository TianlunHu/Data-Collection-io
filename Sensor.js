'use strict';
//----------------- Motion Sensors -------------- //
var TimeStamp = new Array();
var AccVec = new Array();
var rotVec = [];

function accelerationHandler(acceleration, targetId) {
  var info, xyz = "[X, Y, Z]";
  info = xyz.replace("X", acceleration.x && acceleration.x.toFixed(3));
  info = info.replace("Y", acceleration.y && acceleration.y.toFixed(3));
  info = info.replace("Z", acceleration.z && acceleration.z.toFixed(3));
  document.getElementById(targetId).innerHTML = info;
}

function test(){
    console.log("I'm executed");
}

function rotationHandler(rotation, RV, t) {
  var info, xyz = "[t, X, Y, Z]";
  info = xyz.replace("t", t);
  info = info.replace("X", rotation.alpha && rotation.alpha.toFixed(3));
  info = info.replace("Y", rotation.beta && rotation.beta.toFixed(3));
  info = info.replace("Z", rotation.gamma && rotation.gamma.toFixed(3));
  document.getElementById("moRotation").innerHTML = info.shift();
  document.getElementById("timeStamp").innerHTML = t;
  RV.push(info);
  document.getElementById('RotSequence').innerHTML = RV;
  
}

function intervalHandler(interval) {
  document.getElementById("moInterval").innerHTML = interval;
}

if ('LinearAccelerationSensor' in window && 'Gyroscope' in window) {
    document.getElementById('moApi').innerHTML = 'Motion Sensor detected';
    let lastReadingTimestamp;
    let accelerometer = new LinearAccelerationSensor({frequency: 30});
    
    accelerometer.addEventListener('reading', e => {
    if (lastReadingTimestamp) {
        intervalHandler(Math.round(accelerometer.timestamp - lastReadingTimestamp));
    }
    lastReadingTimestamp = accelerometer.timestamp;
    accelerationHandler(accelerometer, 'moAccel');
    xyz[0] = accelerometer.x.toFixed(3);
    xyz[1] = accelerometer.y.toFixed(3);
    xyz[2] = accelerometer.z.toFixed(3);
    AccVec.concat(xyz);
    TimeStamp.concat(accelerometer.timestamp);
    console.log("Acceleration along the X-axis " + accelerometer.x);
    console.log("Acceleration along the Y-axis " + accelerometer.y);
    console.log("Acceleration along the Z-axis " + accelerometer.z);
    
    console.log("here we are: " + TimeStamp + " >> "+ AccVec);
    test();
    });
    
    accelerometer.start();

    if ('GravitySensor' in window) {
        let gravity = new GravitySensor();
        gravity.addEventListener('reading', e => accelerationHandler(gravity, 'moAccelGrav'));
        //accelerationHandler(gravity, 'moAccelGrav');
        gravity.start();
    }

    let gyroscope = new Gyroscope({frequency: 30});
    gyroscope.addEventListener('reading', e => rotationHandler({
    alpha: gyroscope.x,
    beta: gyroscope.y,
    gamma: gyroscope.z
    },rotVec,Date.now()/1000));
    //gyroscope.addEventListener('reading', e => rotVec.push())
    gyroscope.start();
}

else if ('DeviceMotionEvent' in window) {
    document.getElementById('moApi').innerHTML = 'Device Motion Event';

    var onDeviceMotion = function(eventData) {
        accelerationHandler(eventData.acceleration, 'moAccel');
        accelerationHandler(eventData.accelerationIncludingGravity, 'moAccelGrav');
        rotationHandler(eventData.rotationRate);
        intervalHandler(eventData.interval);
    }

    window.addEventListener('devicemotion', onDeviceMotion, false);
}

else {
    document.getElementById('moApi').innerHTML = 'No Sensors API available';
    document.getElementById("moRotation").innerHTML = '[x,y,z]';
}