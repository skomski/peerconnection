describe('PeerConnection', function() {
  it('should get the stream from the other peer', function() {
    var peer1Stream = {};
    var peer2Stream = {};

    var PeerConnection = require('peerconnection');

    var options = {
      iceServers: [{ url: 'stun:stun.l.google.com:19302' }]
    }
    var peer1 = new PeerConnection(options);
    var peer2 = new PeerConnection(options);

    navigator.webkitGetUserMedia({ "audio": true, "fake": true }, function (stream) {
      peer1.addStream(stream);
      peer2.addStream(stream);

      peer1.on('IceCandidate', function(candidate) {
        peer2.addIceCandidate(candidate);
      });

      peer2.on('IceCandidate', function(candidate) {
        peer1.addIceCandidate(candidate);
      });

      peer1.on('AddStream', function(stream) {
        peer1Stream = stream;
      });

      peer2.on('AddStream', function(stream) {
        peer2Stream = stream;
      });

      peer1.createOffer(function(description) {
        peer2.handleOffer(description, function(description) {
          peer1.handleAnswer(description);
        });
      });
    }, function(err) {
      console.log(err);
    });

    waits(1000);

    runs(function() {
      expect(peer1Stream.ended).toEqual(false);
      expect(peer2Stream.ended).toEqual(false);
    });
  });

  it('should get the message from the other peer', function() {
    var peer1Message = '';
    var peer2Message = '';

    var PeerConnection = require('peerconnection');

    var options = {
      iceServers: [{ url: 'stun:stun.l.google.com:19302' }],
      enableDataChannel: true
    }
    var peer1 = new PeerConnection(options);
    var peer2 = new PeerConnection(options);

    peer1.on('IceCandidate', function(candidate) {
      peer2.addIceCandidate(candidate);
    });

    peer2.on('IceCandidate', function(candidate) {
      peer1.addIceCandidate(candidate);
    });

    peer1.on('Message', function(message) {
      peer1Message = message;
    });

    peer2.on('Message', function(message) {
      peer2Message = message;
    });

    peer1.on('DataChannelStateChange', function(state) {
      if (state === 'open') peer1.send('hello peer2');
    });

    peer2.on('DataChannelStateChange', function(state) {
      if (state === 'open') peer2.send('hello peer1');
    });

    peer1.createOffer(function(description) {
      peer2.handleOffer(description, function(description) {
        peer1.handleAnswer(description);
      });
    });

    waits(1000);

    runs(function() {
      expect(peer1Message).toEqual('hello peer1');
      expect(peer2Message).toEqual('hello peer2');
    });
  });
});
