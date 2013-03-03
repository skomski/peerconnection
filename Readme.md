# peerconnection

  In development
  Simplified RTCPeerConnection for Chrome (and Firefox in the future)

## Installation

    $ component install skomski/peerconnection

## Example

Simple one-host example.

```javascript
  var options = {
    iceServers: [{ url: 'stun:stun.l.google.com:19302' }]
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
    alert(message);
  });

  peer2.on('Message', function(message) {
    alert(message);
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
```

## License

  MIT
