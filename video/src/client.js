const constraints = { audio: true, video: { width: 1280, height: 720 } };

async function getVideoStreamAndConnect() {
    // Older browsers might not implement mediaDevices at all, so we set an empty object first
    if (navigator.mediaDevices === undefined) {
        navigator.mediaDevices = {};
    }

    // Some browsers partially implement mediaDevices. We can't just assign an object
    // with getUserMedia as it would overwrite existing properties.
    // Here, we will just add the getUserMedia property if it's missing.
    if (navigator.mediaDevices.getUserMedia === undefined) {
        navigator.mediaDevices.getUserMedia = function(constraints) {

            // First get ahold of the legacy getUserMedia, if present

            // https://stackoverflow.com/questions/56005165/navigator-getusermedia-and-navigator-webkitgetusermedia-undefined-after-updating
            // Since version 74 of Chrome navigator.getUserMedia, navigator.webkitGetUserMedia and navigator.mediaDevices can be used only in secure context (https), otherwise they are undefined. 
            // ということは、 HTTPS でないと undefined か。
            var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

            // Some browsers just don't implement it - return a rejected promise with an error
            // to keep a consistent interface
            if (!getUserMedia) {
                return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
            }

            // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
            return new Promise(function(resolve, reject) {
                getUserMedia.call(navigator, constraints, resolve, reject);
            });
        }
    }
    
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
        console.log("remoteVideo.srcObject");
        console.log(remoteVideo.srcObject);
        // <video autoplay="1"> で自動で実行するのでここで起動する必要なし？
        https://developers.google.com/web/updates/2017/06/play-request-was-interrupted#fix
        remoteVideo.onloadedmetadata = function(e) {
            console.log("remoteVideo.onloadedmetadata");
            console.log(e);
            var playPromise = remoteVideo.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Automatic playback started!
                    // Show playing UI.
                    console.log("Play remote video.");
                })
                .catch(error => {
                    // Auto-play was prevented
                    // Show paused UI.
                    console.log("Cannot play remote video.");
                    console.log(error);
                });
            }
        };
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



