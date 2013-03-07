 'use strict';

describe('PeerConnection', function() {
  it('should get the stream from the other peer', function() {
    var peer1Stream = {};
    var peer2Stream = {};

    var PeerConnection = require('peerconnection');

    var options = {
      iceServers: [{ url: 'stun:stun.l.google.com:19302' }]
    };
    var peer1 = new PeerConnection(options);
    var peer2 = new PeerConnection(options);

    navigator.webkitGetUserMedia({ 'audio': true,'fake': true },
      function (stream) {
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

        peer1.createOffer(function(err, description) {
          if (err) { throw err; }
          peer2.handleOffer(description, function(err, description) {
            if (err) { throw err; }
            peer1.handleAnswer(description, function(err) {
              if (err) { throw err; }
            });
          });
        });
    }, function(err) {
      throw err;
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
    };
    var peer1 = new PeerConnection(options);
    var peer2 = new PeerConnection(options);

    peer1.on('IceCandidate', function(candidate) {
      peer2.addIceCandidate(candidate);
    });

    peer2.on('IceCandidate', function(candidate) {
      peer1.addIceCandidate(candidate);
    });

    peer1.on('DataChannelMessage', function(message) {
      peer1Message = message;
    });

    peer2.on('DataChannelMessage', function(message) {
      peer2Message = message;
    });

    peer1.on('DataChannelStateChange', function(state) {
      if (state === 'open') { peer1.send('hello peer2'); }
    });

    peer2.on('DataChannelStateChange', function(state) {
      if (state === 'open') { peer2.send('hello peer1'); }
    });

    peer1.createOffer(function(err, description) {
      if (err) { throw err; }
      peer2.handleOffer(description, function(err, description) {
        if (err) { throw err; }
        peer1.handleAnswer(description, function(err) {
          if (err) { throw err; }
        });
      });
    });

    waits(1000);

    runs(function() {
      expect(peer1Message).toEqual('hello peer1');
      expect(peer2Message).toEqual('hello peer2');
    });
  });

  it('should emit all StateChange events', function() {
    var peer1ExpectedStateChangeEvents = 'have-local-offer,stable,closed,';
    var peer2ExpectedStateChangeEvents = 'have-remote-offer,stable,closed,';
    var peer1stateChangeEvents = '';
    var peer2stateChangeEvents = '';

    var PeerConnection = require('peerconnection');

    var options = {
      iceServers: [{ url: 'stun:stun.l.google.com:19302' }]
    };
    var peer1 = new PeerConnection(options);
    var peer2 = new PeerConnection(options);

    expect(peer1.readyState).toEqual('stable');
    expect(peer2.readyState).toEqual('stable');

    peer1.on('IceCandidate', function(candidate) {
      peer2.addIceCandidate(candidate);
    });

    peer2.on('IceCandidate', function(candidate) {
      peer1.addIceCandidate(candidate);
    });

    peer1.on('StateChange', function(message) {
      peer1stateChangeEvents += message + ',';
    });

    peer2.on('StateChange', function(message) {
      peer2stateChangeEvents += message + ',';
    });

    peer1.createOffer(function(err, description) {
      if (err) { throw err; }

      peer2.handleOffer(description, function(err, description) {
        if (err) { throw err; }

        peer1.handleAnswer(description, function(err){
          if (err) { throw err; }

          setTimeout( function() {
            peer1.close();
            peer2.close();
          }, 100);
        });
      });
    });

    waits(1000);

    runs(function() {
      expect(peer1stateChangeEvents).toEqual(peer1ExpectedStateChangeEvents);
      expect(peer2stateChangeEvents).toEqual(peer2ExpectedStateChangeEvents);
    });
  });

  it('should emit all IceChange events', function() {
    var peer1ExpectedStateChangeEvents = 'checking,connected,closed,';
    var peer2ExpectedStateChangeEvents = 'checking,connected,closed,';
    var peer1stateChangeEvents = '';
    var peer2stateChangeEvents = '';

    var PeerConnection = require('peerconnection');

    var options = {
      iceServers: [{ url: 'stun:stun.l.google.com:19302' }],
      enableDataChannel: true
    };
    var peer1 = new PeerConnection(options);
    var peer2 = new PeerConnection(options);

    expect(peer1.iceConnectionState).toEqual('starting');
    expect(peer2.iceConnectionState).toEqual('starting');

    peer1.on('IceCandidate', function(candidate) {
      peer2.addIceCandidate(candidate);
    });

    peer2.on('IceCandidate', function(candidate) {
      peer1.addIceCandidate(candidate);
    });

    peer1.on('IceChange', function(message) {
      peer1stateChangeEvents += message + ',';
    });

    peer2.on('IceChange', function(message) {
      peer2stateChangeEvents += message + ',';
    });


    peer1.createOffer(function(err, description) {
      if (err) { throw err; }
      peer2.handleOffer(description, function(err, description) {
        if (err) { throw err; }
        peer1.handleAnswer(description, function(err){
          if (err) { throw err; }

          setTimeout( function() {
            peer1.close();
            peer2.close();
          }, 500);
        });
      });
    });

    waits(1000);

    runs(function() {
      expect(peer1stateChangeEvents).toEqual(peer1ExpectedStateChangeEvents);
      expect(peer2stateChangeEvents).toEqual(peer2ExpectedStateChangeEvents);
    });
  });

  it('should emit all DataChannelStateChange events', function() {
    var peer1ExpectedStateChangeEvents = 'open,close,';
    var peer2ExpectedStateChangeEvents = 'open,close,';
    var peer1stateChangeEvents = '';
    var peer2stateChangeEvents = '';

    var PeerConnection = require('peerconnection');

    var options = {
      iceServers: [{ url: 'stun:stun.l.google.com:19302' }],
      enableDataChannel: true
    };
    var peer1 = new PeerConnection(options);
    var peer2 = new PeerConnection(options);


    peer1.on('IceCandidate', function(candidate) {
      peer2.addIceCandidate(candidate);
    });

    peer2.on('IceCandidate', function(candidate) {
      peer1.addIceCandidate(candidate);
    });

    peer1.on('DataChannelStateChange', function(message) {
      peer1stateChangeEvents += message + ',';
    });

    peer2.on('DataChannelStateChange', function(message) {
      peer2stateChangeEvents += message + ',';
    });

    peer1.createOffer(function(err, description) {
      if (err) { throw err; }
      peer2.handleOffer(description, function(err, description) {
        if (err) { throw err; }
        peer1.handleAnswer(description, function(err){
          if (err) { throw err; }

          expect(peer1.dataChannel.readyState).toEqual('connecting');

          setTimeout( function() {
            peer1.close();
            peer2.close();
          }, 500);
        });
      });
    });

    waits(1000);

    runs(function() {
      expect(peer1stateChangeEvents).toEqual(peer1ExpectedStateChangeEvents);
      expect(peer2stateChangeEvents).toEqual(peer2ExpectedStateChangeEvents);
    });
  });
});
