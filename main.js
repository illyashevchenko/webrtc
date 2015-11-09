/**
 * Created by Illia_Shevchenko on 09.11.2015.
 */
'use strict';

// Put variables in global scope to make them available to the browser console.
var constraints = window.constraints = {
  audio: true,
  video: true
};

makeConstraintsConsistent(constraints).then(function () {
  console.log('Actual constraints: ', constraints);
  startWebRtc(constraints, document.querySelector('video'), document.querySelector('#errorMsg'));
});


function makeConstraintsConsistent(constraints) {
  //in IE I couldn't still use this. Even with polyfill
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    //emulate promises. In angular - use $q
    return {
      then: function (callback) {
        return callback(constraints);
      }
    };
  }

  return navigator.mediaDevices.enumerateDevices().then(function (devices) {
    checkKind('video');
    checkKind('audio');

    return constraints; //for promise chaining if needed

    function checkKind(kind) {
      if (!constraints.hasOwnProperty(kind) || !constraints[kind]) {
        return;
      }

      var kindString = kind + 'input';
      var anyDevice = devices.some(function (device) {
        return device.kind === kindString;
      });
      console.log('check', kind);

      if (!anyDevice) {
        constraints[kind] = false;
        console.log(kind, 'is not present, disabling');
      }
    }
  });
}


function startWebRtc(constraints, videoElement, errorElement) {
//use method given from Temasys-adapter. It does not support promises. https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getUserMedia
  getUserMedia(constraints, onSuccess, onError);

  function onSuccess(stream) {
    var videoTracks = stream.getAudioTracks();
    console.log('Got stream with constraints:', constraints);
    console.log('Using video device: ' + videoTracks[0].label);

    stream.onended = function() {
      console.log('Stream ended');
    };

    window.stream = stream; // make variable available to browser console
    videoElement.srcObject = stream;
  }

  function onError(error) {
    if (error.name === 'ConstraintNotSatisfiedError' && constraints.video.width) {
      errorMsg('The resolution ' + constraints.video.width.exact + 'x' +
          constraints.video.width.exact + ' px is not supported by your device.');
      return;
    }

    if (error.name === 'PermissionDeniedError') {
      errorMsg('Permissions have not been granted to use your media devices, ' +
          'you need to allow the page access to your devices in ' +
          'order for the demo to work.');
      return;
    }

    errorMsg('getUserMedia error: ' + error.name, error);
  }

  function errorMsg(msg, error) {
    errorElement.innerHTML += '<p>' + msg + '</p>';
    if (typeof error !== 'undefined') {
      console.error(error);
    }
  }
}

