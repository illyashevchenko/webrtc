/**
 *
 * @param videoInput video element reference
 * @param videoOutput video element reference
 * @param options object {{ onIceCandidate:function, onError : function, onProgress : function}}
 *
 * @returns {{start: start, processAnswer: processAnswer, destroy: destroy}}
 * @constructor
 */
function HitWebRTC(videoInput, videoOutput, options) {
  console.log(options);
  var webRtcPeer;

  function _onError(error) {
    if (options.onError) {
      options.onError(error);
    }
    console.error('webrtc error: ', error);
  }

  function _onProgress(progress) {
    if (options.onProgress) {
      options.onProgress(progress);
    }
  }

  function _onIceCandidate(candidate) {
    if (options.onIceCandidate) {
      options.onIceCandidate(candidate);
    }
  }

  function _onAnswerProcessed() {
    _onProgress(100);
  }

  /**
   * Initialize communication channel
   *
   * @param onOfferCallBack webrtc offer callback
   * @param onError error callback
   */
  function start(onOfferCallBack, onError) {
    dispose();
    _onProgress(0);

    var kurentoOptions = {
      localVideo : videoInput,
      remoteVideo : videoOutput,
      mediaConstraints : options.mediaConstraints || undefined,
      onicecandidate : _onIceCandidate,
      onerror : _onError
    };

    webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(kurentoOptions, function(error) {
      if (error && onError) {
        console.error('WebRtcPeerSendrecv eror:', error);
        onError(error);
        return;
      }
      _onProgress(30);
      webRtcPeer.generateOffer(function (error, sdpOffer){
        onOfferCallBack(error, sdpOffer);
        _onProgress(60);
      }, options.mediaConstraints.video);
    });
  }

  function processAnswer(answer, callback) {
    if (!webRtcPeer) {
      throw new Error("WebRTC component is not started!");
    }
    webRtcPeer.processAnswer(answer, function(error) {
      _onAnswerProcessed();
      if (callback) {
        callback(error);
      }
    });
  }

  function addIceCandidate(candidate, callback) {
    webRtcPeer.addIceCandidate(candidate, function (error) {
      if (callback) {
        callback(error);
      }
    });
  }

  function getVideoTrack() {
    return webRtcPeer ? webRtcPeer.getLocalStream().getVideoTracks()[0] : undefined;
  }

  function getAudioTrack() {
    return webRtcPeer ? webRtcPeer.getLocalStream().getAudioTracks()[0] : undefined;
  }

  function dispose() {
    if (webRtcPeer) {
      webRtcPeer.dispose();
      webRtcPeer = undefined
    }
  }

  return {
    start : start,
    processAnswer : processAnswer,
    addIceCandidate : addIceCandidate,
    getVideoTrack : getVideoTrack,
    getAudioTrack : getAudioTrack,
    dispose : dispose
  }
}
