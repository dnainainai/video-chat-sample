const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/client.js', (req, res) => {
    res.sendFile(__dirname + '/client.js');
});

app.get('/style.css', (req, res) => {
    res.sendFile(__dirname + '/style.css');
});

var offerSdp = null;
var peer1 = null;
var peer2 = null;

function reset() {
    log("reset()")
    peer1 = null;
    peer2 = null;
    offerSdp = null;
}

io.on('connection', (socket) => {
    log("[Client connect] socket.id   : " +  socket.id);
    log("[Client connect] socket.handshake.headers.host       : " + socket.handshake.headers.host);
    log("[Client connect] socket.handshake.headers.connection : " + socket.handshake.headers.connection);
    log("[Client connect] socket.handshake.address                    : " +  socket.handshake.address);

    if (peer1 == null) {
        log("[REQUEST_PEER1_OFFER_SDP] : Peer1");
        log("Set Peer1")
        peer1 = socket.id;
        io.to(peer1).emit("REQUEST_PEER1_OFFER_SDP", "");
    } else if (peer2 == null) {
        log("[REQUEST_REER2_ANSWER_SDP] : Peer2");
        peer2 = socket.id;
        // offerSdp is nullable
        io.to(peer2).emit("REQUEST_REER2_ANSWER_SDP", offerSdp);
    } else {
        // ignore ?
        log("[IGNORE] : Peer ?");
        return;
    }

    socket.on('SEND_OFFER_SDP', (data) => {
        log("[SEND_OFFER_SDP] : " +  data);
        offerSdp = data;
    });
    socket.on('SEND_ANSWER_SDP', (data) => {
        log("[SEND_ANSWER_SDP] : " +  data);
        if (peer1 == null) {
            log("[SEND_ANSWER_SDP] : Peer1 is null.");
        } else {
            io.to(peer1).emit("SEND_PEER1_ANSWER_SDP", data);
        }
    });
    socket.on("CANDIDATE", (data) => {
        log("[CANDIDATE] : " +  data);
        if (data.peer1 == true) {
            io.to(peer2).emit("CANDIDATE", data.candidate);
        } else {
            io.to(peer1).emit("CANDIDATE", data.candidate);
        }
    });
    socket.on("RESET", (data) => {
        reset();
    });

    socket.on("disconnect", (reason) => {
        log("[Disconnect] : " +  socket.id);
        reset();
    });
});

function toJapanDateString() {
    const date = new Date();
    date.setTime(date.getTime() + 1000 * 60 * 60 * 9);
    return date.toLocaleString();
}

function log(message) {
    console.log(toJapanDateString() + " " + message);
}

http.listen(3001, () => {
  log('listening on *:3001');
});

