if (!RTCPeerConnection) {
  var RTCPeerConnection = window.PeerConnection ||
                          window.webkitPeerConnection00 ||
                          window.webkitRTCPeerConnection;
}

var EventEmitter

var PeerConnection = function(options) {
  if (!_.isString(options.stunServer))
    throw new Error('stunServer is not a string - new RTCSocket');
  if (!_.isFunction(options.onIceCandidate))
    throw new Error('onIceCandidate is not a function - RTCSocket.create');
  if (!_.isFunction(options.onDataOpen))
    throw new Error('onDataOpen is not a function - RTCSocket.create')
  if (!_.isFunction(options.onStateChange))
    throw new Error('onStateChange is not a function - RTCSocket.create');
  if (!_.isFunction(options.onMessage))
    throw new Error('onMessage is not a function - RTCSocket.create');

  this.servers = {
    iceServers: [{ url: options.stunServer }]
  }
  this.connectionOptions = {
    optional: [{ RtpDataChannels: true }]
  }

  this.dataChannel = null;
  this.onDataOpen = options.onDataOpen;
  this.onMessage = options.onMessage;

  this.peerConnection = new RTCPeerConnection(
    this.servers, this.connectionOptions);

  var onIceCandidate = function() {
    if (event.candidate) {
      options.onIceCandidate(event.candidate);
    }
  }

  this.peerConnection.onicecandidate = onIceCandidate;
  this.peerConnection.onicechange = options.onStateChange;
}

PeerConnection.prototype.createOffer = function(cb) {
  if (!_.isFunction(cb))
    throw new Error('cb is not a function - RTCSocketConnection.createOffer');

  this.dataChannel = this.peerConnection.createDataChannel(
    'sendDataChannel',
    { reliable: false }
  );

  this.dataChannel.onmessage = this.onMessage;
  this.dataChannel.onopen    = this.onDataOpen;

  var self = this;
  this.peerConnection.createOffer(function (description) {
    self.peerConnection.setLocalDescription(description);
    cb(description);
  });
}

PeerConnection.prototype.setAnswer = function(description) {
  if (!description)
    throw new Error('description is not present - RTCSocketConnection.setAnswer');

  this.peerConnection.setRemoteDescription(new RTCSessionDescription(description));
}


PeerConnection.prototype.setCandidate = function(candidate) {
  if (!candidate)
    throw new Error('candidate is not present - RTCSocketConnection.setCandidate');

  this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

PeerConnection.prototype.createAnswer = function(cb) {
  if (!_.isFunction(cb))
    throw new Error('cb is not a function - RTCSocketConnection.createAnswer');
  var self = this;

  this.peerConnection.ondatachannel = function (event) {
    self.dataChannel = event.channel;
    self.dataChannel.onmessage = self.onMessage;
    self.dataChannel.onopen    = self.onDataOpen;
  };

  this.peerConnection.createAnswer(function (description) {
    self.peerConnection.setLocalDescription(description);
    cb(description);
  });
}


PeerConnection.prototype.send = function(message) {
  if (!_.isString(message))
    throw new Error('message is not a string - RTCSocketConnection.send');
  this.dataChannel.send(message);
}
