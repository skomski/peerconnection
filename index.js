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

  this.rtcConfiguration = {
    iceServers: options.iceServers
  }

  this.rtcOptions = {
    optional: [{ RtpDataChannels: true }]
  }

  this.dataChannel = undefined;
  this.peerConnection = new RTCPeerConnection(
    this.rtcConfiguration, this.rtcOptions);

  this.peerConnection.onstatechange = function(event) {
    if (event.candidate) {
      self.emit('StateChange', event.candidate);
    }
  }

  this.peerConnection.onicecandidate = function(event) {
    if (event.candidate) {
      self.emit('IceCandidate', event.candidate);
    }
  }
}

module.exports = PeerConnection;
Emitter(PeerConnection.prototype);

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

PeerConnection.prototype.createOffer = function(cb) {
  if (!_.isFunction(cb))
    throw new Error('cb is not a function - PeerConnection.createOffer');

  var self = this;

  this._createDataChannel();

  this.peerConnection.createOffer(function (description) {
    self.peerConnection.setLocalDescription(description);
    cb(description);
  });
}

PeerConnection.prototype.handleAnswer = function(description, cb) {
  if (!description)
    throw new Error('description is not present - PeerConnection.handleAnswer');

  this.peerConnection.setRemoteDescription(new RTCSessionDescription(description));
}

PeerConnection.prototype.handleOffer = function(description, cb) {
  if (!description)
    throw new Error('description is not present - PeerConnection.handleOffer');
  if (!_.isFunction(cb))
    throw new Error('cb is not a function - PeerConnection.handleOffer');

  this.peerConnection.setRemoteDescription(new RTCSessionDescription(description));

  var self = this;

  this.peerConnection.ondatachannel = function (event) {
    if (event.channel) self._createDataChannel(event.channel);
  };

  this.peerConnection.createAnswer(function (description) {
    self.peerConnection.setLocalDescription(description);
    cb(description);
  });
}

PeerConnection.prototype.addIceCandidate = function(candidate) {
  if (!candidate)
    throw new Error('candidate is not present - PeerConnection.setCandidate');

  this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}


PeerConnection.prototype.send = function(message) {
  if (!_.isString(message))
    throw new Error('message is not a string - PeerConnection.send');

  this.dataChannel.send(message);
}
