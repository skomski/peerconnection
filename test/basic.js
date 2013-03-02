var PeerConnection = require('peerconnection');

describe('PeerConnection', function(){
  describe('#constructor', function(){
    it('should throw error when options is not present', function(){
      expect(function() { new PeerConnection() })
        .toThrow(new Error('options is not an object - new RTCSocket'));
    });
    it('should throw error when stunServer is not present', function(){
      var options = {};
      expect(function() { new PeerConnection(options) })
        .toThrow(new Error('stunServer is not a string - new RTCSocket'));
    });
  });
});
