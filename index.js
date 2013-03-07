'use strict';

var RTCPeerConnection = window.PeerConnection ||
                        window.webkitPeerConnection00 ||
                        window.webkitRTCPeerConnection ||
                        window.mozRTCPeerConnection;

var RTCIceCandidate = window.RTCIceCandidate ||
                      window.mozRTCIceCandidate;

var RTCSessionDescription = window.RTCSessionDescription ||
                            window.mozRTCSessionDescription;

var emitter = require('emitter');
var _ = require('underscore');

var PeerConnection = function(options) {
  if (!_.isObject(options)) {
    throw new Error('options is not an object - new PeerConnection');
  }
  if (!_.isArray(options.iceServers)) {
    throw new Error('iceServers is not an array - new PeerConnection');
  }

  var self = this;

  this.enableDataChannel = options.enableDataChannel || false;

  this.rtcConfiguration = {
    iceServers: options.iceServers
  };

  this.mediaConstraints = {
    optional: [{ RtpDataChannels: true }]
  };

  this.dataChannel = undefined;
  this.peerConnection = new RTCPeerConnection(
    this.rtcConfiguration, this.mediaConstraints);

  this.peerConnection.onstatechange = function() {
    self.emit('StateChange', self.peerConnection.readyState);
  };

  this.peerConnection.onicecandidate = function(event) {
    if (event.candidate) {
      self.emit('IceCandidate', event.candidate);
    }
  };

  this.peerConnection.onaddstream = function(event) {
    if (event.stream) {
      self.emit('AddStream', event.stream);
    }
  };

  this.peerConnection.onremovestream = function(event) {
    if (event.stream) {
      self.emit('RemoveStream', event.stream);
    }
  };

  this.peerConnection.onicechange = function() {
    self.emit('IceChange', self.peerConnection.iceConnectionState);
  };
};

module.exports = PeerConnection;
emitter(PeerConnection.prototype);

Object.defineProperty(PeerConnection.prototype, 'iceConnectionState', {
  get: function() {
    return this.peerConnection.iceConnectionState;
  }
});

Object.defineProperty(PeerConnection.prototype, 'readyState', {
  get: function() {
    return this.peerConnection.readyState;
  }
});

Object.defineProperty(PeerConnection.prototype, 'localStreams', {
  get: function() {
    return this.peerConnection.localStreams;
  }
});

Object.defineProperty(PeerConnection.prototype, 'remoteStreams', {
  get: function() {
    return this.peerConnection.remoteStreams;
  }
});

Object.defineProperty(PeerConnection.prototype, 'remoteDescription', {
  get: function() {
    return this.peerConnection.remoteDescription;
  }
});

Object.defineProperty(PeerConnection.prototype, 'localDescription', {
  get: function() {
    return this.peerConnection.localDescription;
  }
});

PeerConnection.prototype.getStats = function() {
  return this.peerConnection.getStats();
};

PeerConnection.prototype._createDataChannel = function(dataChannel) {
  var self = this;

  this.dataChannel = dataChannel;

  if (this.dataChannel === undefined) {
    this.dataChannel = this.peerConnection.createDataChannel(
      'dataChannel',
      { reliable: false }
    );
  }

  this.dataChannel.onmessage = function(event) {
    self.emit('DataChannelMessage', event.data);
  };
  this.dataChannel.onopen    = function() {
    self.emit('DataChannelStateChange', 'open');
  };
  this.dataChannel.onerror   = function(err) {
    self.emit('DataChannelError', err);
  };
  this.dataChannel.onclose   = function() {
    self.emit('DataChannelStateChange', 'close');
  };
};

PeerConnection.prototype.close = function() {
  return this.peerConnection.close();
};

PeerConnection.prototype.updateIceServers = function(options) {
  if (!_.isObject(options)) {
    throw new Error(
      'options is not an object - PeerConnection.updateIceServers');
  }
  if (!_.isArray(options.iceServers)) {
    throw new Error(
      'options.iceServers is not an array - PeerConnection.updateIceServers');
  }

  this.rtcConfiguration.iceServers = options.iceServers;

  return this.peerConnection.updateIce(
    this.rtcConfiguration,
    this.mediaConstraints,
    options.restart || false);
};

PeerConnection.prototype.addStream = function(stream) {
  if (!_.isObject(stream)) {
    throw new Error('stream is not an object - PeerConnection.addStream');
  }

  return this.peerConnection.addStream(stream);
};

PeerConnection.prototype.removeStream = function(stream) {
  if (!_.isObject(stream)) {
    throw new Error('stream is not an object - PeerConnection.removeStream');
  }

  return this.peerConnection.removeStream(stream);
};

PeerConnection.prototype.createOffer = function(cb) {
  if (!_.isFunction(cb)) {
    throw new Error('cb is not a function - PeerConnection.createOffer');
  }

  var self = this;

  if (this.enableDataChannel) {
    this._createDataChannel();
  }

  this.peerConnection.createOffer(function (description) {
    self.peerConnection.setLocalDescription(description, function() {
      cb(null, description);
    },
    function(err) {
      var error = new Error(
        'setLocalDescription failed - PeerConnection.createOffer');
      error.internalError = err;
      cb(error);
    });
  }, function(err) {
    var error = new Error(
      'createOffer failed - PeerConnection.createOffer');
    error.internalError = err;
    cb(error);
  });
};

PeerConnection.prototype.handleAnswer = function(remoteDescription, cb) {
  if (!_.isObject(remoteDescription)) {
    throw new Error(
      'remoteDescription is not an object - PeerConnection.handleAnswer');
  }
  if (!_.isFunction(cb)) {
    throw new Error('cb is not a function - PeerConnection.handleAnswer');
  }

  var sessionDescription;
  try {
    sessionDescription = new RTCSessionDescription(remoteDescription);
  } catch (err) {
    var error = new Error(
      'new RTCSessionDescription failed - PeerConnection.handleAnswer');
    error.internalError = err;
    cb(error);
  }

  this.peerConnection.setRemoteDescription(
    sessionDescription,
    function() {
      cb(null);
    }, function(err) {
      var error = new Error(
        'setRemoteDescription failed - PeerConnection.handleAnswer');
      error.internalError = err;
      cb(error);
    });
};

PeerConnection.prototype.handleOffer = function(remoteDescription, cb) {
  if (!_.isObject(remoteDescription)) {
    throw new Error(
      'remoteDescription is not an object - PeerConnection.handleOffer');
  }
  if (!_.isFunction(cb)) {
    throw new Error('cb is not a function - PeerConnection.handleOffer');
  }

  var self = this;

  var sessionDescription;
  try {
    sessionDescription = new RTCSessionDescription(remoteDescription);
  } catch (err) {
    var error = new Error(
      'new RTCSessionDescription failed - PeerConnection.handleOffer');
    error.internalError = err;
    cb(error);
  }

  if (self.enableDataChannel) {
    self.peerConnection.ondatachannel = function (event) {
      if (event.channel) {
        self._createDataChannel(event.channel);
      }
    };
  }

  this.peerConnection.setRemoteDescription(
    sessionDescription,
    function() {
      self.peerConnection.createAnswer(function (localDescription) {
        self.peerConnection.setLocalDescription(localDescription, function() {
          cb(null, localDescription);
        }, function(err) {
          var error = new Error(
            'setLocalDescription failed - PeerConnection.handleOffer');
          error.internalError = err;
          cb(error);
        });
      }, function(err) {
        var error = new Error(
          'createAnswer failed - PeerConnection.handleOffer');
        error.internalError = err;
        cb(error);
      });
    },
    function(err) {
      var error = new Error(
        'setRemoteDescription failed - PeerConnection.handleOffer');
      error.internalError = err;
      cb(error);
    });
};

PeerConnection.prototype.addIceCandidate = function(candidate) {
  if (!_.isObject(candidate)) {
    throw new Error(
      'candidate is not an object - PeerConnection.addIceCandidate');
  }

  this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
};

PeerConnection.prototype.send = function(data) {
  if (!_.isString(data)) {
    throw new Error('data is not present - PeerConnection.send');
  }

  this.dataChannel.send(data);
};
