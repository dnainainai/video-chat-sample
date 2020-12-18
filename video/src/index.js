const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  log("[Client connect] socket.user : " +  socket.user);
  log("[Client connect] socket.id   : " +  socket.id);
  log("[Client connect] socket.handshake.headers.host       : " + socket.handshake.headers.host);
  log("[Client connect] socket.handshake.headers.connection : " + socket.handshake.headers.connection);
  log("[Client connect] socket.handshake.address                    : " +  socket.handshake.address);
  log("[Client connect] socket.request.connection.remoteAddress     : " +  socket.request.connection.remoteAddress);
  log("[Client connect] socket.request.connection._peername.address : " +  socket.request.connection._peername.address);

  socket.on('SEND_SDP', (data) => {
    log("[Client chat message] : " +  socket.id);

    data.sdp.id = socket.id;
    if (data.target) {
      socket.to(data.target).emit("RECEIVE_SDP", data.sdp);
    } else {
      socket.broadcast.to(socket.roomname).emit("RECEIVE_SDP", data.sdp);
    }
    
  });
  socket.on("SEND_CANDIDATE", (data) => {
    if (data.target) {
      data.ice.id = socket.id;
      socket.to(data.target).emit("RECEIVE_CANDIDATE", data.ice);
    } else {
      log("candidate neet target id");
    }
  });
  socket.on("disconnect", (reason) => {
    log("[Client disconnect] " +  socket.id);
  });
});

function toJapanDateString() {
  const date = new Date();
  date.setTime(date.getTime() + 1000 * 60 * 60 * 9);
  return date.toLocaleString();
}

http.listen(3000, () => {
  log('listening on *:3000');
});

function log(message) {
  console.log(toJapanDateString() + " " + message);
  
}