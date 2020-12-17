async function getVideoStreamAndConnect() {
     var constraints = { audio: true, video: { width: 1280, height: 720 } };
     navigator.mediaDevices.getUserMedia(constraints)
     .then(function(stream) {
       var video = document.querySelector('video');
       video.srcObject = stream
       video.onloadedmetadata = function(e) {
         video.play();
       };
       console.log(stream);
       connect(stream);
     })
     .catch(function(err) {
       console.log(err.name + ": " + err.message);
     });
}

var socket = null;

function getSocket() {
    if (socket == null) {
        socket = io();
    }
    return socket;
}

async function connect(localVideoStream) {
    const localVideo = document.getElementById('localVideo');
    localVideo.srcObject = localVideoStream;

    // connect signaling server
    socket = getSocket();

    // https://webrtc.org/getting-started/peer-connections
    const peerConnection = new RTCPeerConnection({'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]});

    // video
    peerConnection.addTrack(localVideoStream.getVideoTracks()[0], localVideoStream);
    // audio
    peerConnection.addTrack(localVideoStream.getAudioTracks()[0], localVideoStream);

    var peer1 = true;
    peerConnection.onicecandidate = function(event) {
        // todo どこで remote video を設定？
        // remoteVideo.srcObject
        // console.log("onicecandidate");
        // console.log(event);
        if (event.candidate) {
            // Send the candidate to the remote peer
            // console.log("candidate");
            socket.emit("CANDIDATE", { peer1: peer1, candidate: event.candidate });
        } else {
           // All ICE candidates have been sent
           console.log("all candidate");
        }
    }
    socket.on("CANDIDATE", async (candidate) => {
        console.log("CANDIDATE");
        console.log(candidate);
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });


    // Listen for connectionstatechange on the local RTCPeerConnection
    peerConnection.addEventListener('connectionstatechange', event => {
        if (peerConnection.connectionState === 'connected') {
            // Peers connected!
            console.log("connected.");
            console.log(event);

            socket.emit("RESET", "");
        }
    });

    peerConnection.ontrack = function(event) {
        console.log("ontrack");
        console.log(event);

        const remoteVideo = document.getElementById('remoteVideo');
        remoteVideo.srcObject = event.streams[0];
        remoteVideo.play();
    }

    socket.on("REQUEST_PEER1_OFFER_SDP", async (data) => {
        console.log("REQUEST_PEER1_OFFER_SDP");
        peer1 = true;

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        // Send Offer SDP to the signaling server
        socket.emit("SEND_OFFER_SDP", peerConnection.localDescription);
    });
    socket.on("SEND_PEER1_ANSWER_SDP", async (answerSdp) => {
        console.log("SEND_PEER1_ANSWER_SDP");
        console.log(answerSdp);

        await peerConnection.setRemoteDescription(new RTCSessionDescription(answerSdp));
    });

    socket.on("REQUEST_REER2_ANSWER_SDP", async (offerSdp) => {
        console.log("REQUEST_REER2_ANSWER_SDP");
        console.log(offerSdp);

        peer1 = false;

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offerSdp));
        const answer = peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("SEND_ANSWER_SDP", peerConnection.localDescription);
    });
}

document.getElementById("connect").addEventListener("click", () => {
    getVideoStreamAndConnect();
});
document.getElementById("reset").addEventListener("click", () => {
    socket = getSocket();
    socket.emit("RESET", "");
});



