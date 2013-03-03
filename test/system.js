describe('PeerConnection', function() {
  it('should get the message from the other peer', function() {
    var peer1Message = '';
    var peer2Message = '';

    var PeerConnection = require('peerconnection');

    var options = {
      iceServers: [{ url: 'stun:stun.l.google.com:19302' }]
    }
    var peer1 = new PeerConnection(options);
    var peer2 = new PeerConnection(options);
    window.peer1 = peer1;
    window.peer2 = peer2;

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
