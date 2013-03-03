var PeerConnection = require('peerconnection');

describe('PeerConnection', function(){
  describe('#constructor', function(){
    it('should throw error when options is not present', function(){
      expect(function() { new PeerConnection() })
        .toThrow(new Error('options is not an object - new PeerConnection'));
    });
    it('should throw error when stunServer is not present', function(){
      var options = {};
      options.iceServers = null;

      expect(function() { new PeerConnection(options) })
        .toThrow(new Error('iceServers is not an array - new PeerConnection'));
    });
    it('should work if everything is present', function(){
      var options = {};
      options.iceServers = [{ url: 'stun:stun.google' }];

      var peerConnection = new PeerConnection(options);

      expect(peerConnection.dataChannel).toEqual(undefined);
    });
  });
  describe('createOffer', function(){
    var options = {};
    options.iceServers = [{ url: 'stun:stun.google' }];
    var peerConnection;

    beforeEach(function() {
      peerConnection = new PeerConnection(options);
    });
    afterEach(function() {
      peerConnection = null;
    });

    it('should throw error when cb is not present', function(){
      expect(function() { peerConnection.createOffer(); })
        .toThrow(new Error('cb is not a function - PeerConnection.createOffer'));
    });
    it('should return a description when everything is present', function(){
      var cb = jasmine.createSpy();

      peerConnection.createOffer(cb);

      waitsFor(function() {
        return cb.callCount > 0;
      });

      runs(function() {
        expect(cb.callCount).toEqual(1);
        expect(cb.argsForCall[0][0].type).toEqual('offer');
        expect(cb.argsForCall[0][0].sdp).toBeTruthy();
      });
    });
  });

  describe('handleAnswer', function() {
    var options = {};
    options.iceServers = [{ url: 'stun:stun.google' }];
    var connection;

    beforeEach(function() {
      connection = new PeerConnection(options);
    });
    afterEach(function() {
      connection = null;
    });

    it('should throw error when description is not present', function(){
      expect(function() { connection.handleAnswer(); })
        .toThrow(new Error('description is not an object - PeerConnection.handleAnswer'));
    });
  });

  describe('handleOffer', function() {
    var options = {};
    options.iceServers = [{ url: 'stun:stun.google' }];
    var connection;

    beforeEach(function() {
      connection = new PeerConnection(options);
    });
    afterEach(function() {
      connection = null;
    });

    it('should throw error when description is not present', function(){
      expect(function() { connection.handleOffer(); })
        .toThrow(new Error('description is not an object - PeerConnection.handleOffer'));
    });
  });

  describe('addIceCandidate', function() {
    var options = {};
    options.iceServers = [{ url: 'stun:stun.google' }];
    var connection;

    beforeEach(function() {
      connection = new PeerConnection(options);
    });
    afterEach(function() {
      connection = null;
    });

    it('should throw error when candidate is not present', function(){
      expect(function() { connection.addIceCandidate(); })
        .toThrow(new Error('candidate is not an object - PeerConnection.addIceCandidate'));
    });
  });

  describe('send', function() {
    var options = {};
    options.iceServers = [{ url: 'stun:stun.google' }];
    var connection;

    beforeEach(function() {
      connection = new PeerConnection(options);
    });
    afterEach(function() {
      connection = null;
    });

    it('should throw error when data is not present', function(){
      expect(function() { connection.send(); })
        .toThrow(new Error('data is not present - PeerConnection.send'));
    });
  });
});
