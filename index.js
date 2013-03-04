var RTCPeerConnection = window.PeerConnection ||
                        window.webkitPeerConnection00 ||
                        window.webkitRTCPeerConnection ||
                        window.mozRTCPeerConnection;

var RTCIceCandidate = window.RTCIceCandidate ||
                      window.mozRTCIceCandidate;

var RTCSessionDescription = window.RTCSessionDescription ||
                            window.mozRTCSessionDescription;

var Emitter = require('emitter');
var _ = require('underscore');

var PeerConnection = function(options) {
  if (!_.isObject(options))
    throw new Error('options is not an object - new PeerConnection');
  if (!_.isArray(options.iceServers))
    throw new Error('iceServers is not an array - new PeerConnection');

  var self = this;

  this.enableDataChannel = options.enableDataChannel || false;

  this.rtcConfiguration = {
    iceServers: options.iceServers
  }

  this.mediaConstraints = {
    optional: [{ RtpDataChannels: true }]
  }

  this.dataChannel = undefined;
  this.peerConnection = new RTCPeerConnection(
    this.rtcConfiguration, this.mediaConstraints);

  this.peerConnection.onstatechange = function(event) {
    self.emit('StateChange', event.candidate);
  }

  this.peerConnection.onicecandidate = function(event) {
    if (event.candidate) {
      self.emit('IceCandidate', event.candidate);
    }
  }

  this.peerConnection.onaddstream = function(event) {
    if (event.stream) {
      self.emit('AddStream', event.stream);
    }
  }

}

module.exports = PeerConnection;
Emitter(PeerConnection.prototype);

Object.defineProperty(PeerConnection.prototype, "iceState", {
  get: function() {
    return this.peerConnection.iceState;
  }
});

Object.defineProperty(PeerConnection.prototype, "readyState", {
  get: function() {
    return this.peerConnection.readyState;
  }
});

Object.defineProperty(PeerConnection.prototype, "localStreams", {
  get: function() {
    return this.peerConnection.localStreams;
  }
});

Object.defineProperty(PeerConnection.prototype, "remoteStreams", {
  get: function() {
    return this.peerConnection.remoteStreams;
  }
});

PeerConnection.prototype.getStats = function() {
  return this.peerConnection.getStats();
}

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
    self.emit('Message', event.data);
  }
  this.dataChannel.onopen    = function(event) {
    self.emit('DataChannelStateChange', 'open');
  }
  this.dataChannel.onclose    = function(event) {
    self.emit('DataChannelStateChange', 'close');
  }
}

PeerConnection.prototype.close = function() {
  return this.peerConnection.close();
}

PeerConnection.prototype.restartIce = function() {
  return this.peerConnection.updateIce(
    this.rtcConfiguration,
    this.mediaConstraints,
    true);
}

PeerConnection.prototype.updateIceServers = function(options) {
  this.rtcConfiguration.iceServers = options.iceServers;

  return this.peerConnection.updateIce(
    this.rtcConfiguration,
    this.mediaConstraints,
    options.restart || false);
}

PeerConnection.prototype.addStream = function(stream) {
  return this.peerConnection.addStream(stream);
}

PeerConnection.prototype.removeStream = function(stream) {
  return this.peerConnection.removeStream(stream);
}

PeerConnection.prototype.createOffer = function(cb) {
  if (!_.isFunction(cb))
    throw new Error('cb is not a function - PeerConnection.createOffer');

  var self = this;

  if (this.enableDataChannel) this._createDataChannel();

  this.peerConnection.createOffer(function (description) {
    self.peerConnection.setLocalDescription(description);
    cb(description);
  });
}

PeerConnection.prototype.handleAnswer = function(description) {
  if (!_.isObject(description))
    throw new Error('description is not an object - PeerConnection.handleAnswer');

  this.peerConnection.setRemoteDescription(new RTCSessionDescription(description));
}

PeerConnection.prototype.handleOffer = function(description, cb) {
  if (!_.isObject(description))
    throw new Error('description is not an object - PeerConnection.handleOffer');
  if (!_.isFunction(cb))
    throw new Error('cb is not a function - PeerConnection.handleOffer');

  this.peerConnection.setRemoteDescription(new RTCSessionDescription(description));

  var self = this;

  if (this.enableDataChannel) {
    this.peerConnection.ondatachannel = function (event) {
      if (event.channel) self._createDataChannel(event.channel);
    };
  }

  this.peerConnection.createAnswer(function (description) {
    self.peerConnection.setLocalDescription(description);
    cb(description);
  });
}

PeerConnection.prototype.addIceCandidate = function(candidate) {
  if (!_.isObject(candidate))
    throw new Error('candidate is not an object - PeerConnection.addIceCandidate');

  this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}


PeerConnection.prototype.send = function(data) {
  if (!_.isString(data))
    throw new Error('data is not present - PeerConnection.send');

  this.dataChannel.send(data);
}
