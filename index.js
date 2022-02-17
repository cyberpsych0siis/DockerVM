const WebSocketServer = require('ws').Server;
const websocketStream = require('websocket-stream');
const http = require("http");
const logger = require("morgan");
const { parse } = require("url");

const express = require("express");
const expressStatic = require("express-static");
const process = require("process");

const DockerClient = require("./DockerClient.js");

(function () {
  const app = express();
  app.use(logger('dev'));

  app.use("/", expressStatic('public'));

  const wss = new WebSocketServer({
    noServer: true
  });

  //bypass validation for now
  function validateSession(token) {
    return true;
  }

  //on new WebSocketServer connection, connect websocket with a new DockerClient instance
  wss.on('connection', function connect(ws) {
    console.log("New Connection");
    let dClient = new DockerClient({
      websocket: ws
    });

    dClient.start().then((container) => {
      container.attach(websocketStream(ws));
    })
      .catch((err) => {
        dClient.remove();
        console.error(err);
        ws.send(err.message);
      });
  });

  //our http server which handles websocket proxy and static
  const server = app.listen(process.env.WEBSOCKET_PORT ?? 8085, () => { console.log("Listening") });
  server.on('upgrade', (request, socket, head) => {
    let { path } = parse(request.url);

    console.log(request.headers);

    if (validateSession(request.headers.cookie)) {
      if (path === "/socket") {
        wss.handleUpgrade(request, socket, head, socket => {
          //if the httpServer gets an 'upgrade' event we need to switch our connection
          wss.emit('connection', socket, request);
        });
      }
    } else {
      socket.write('HTTP/1.1 401 Web Socket Protocol Handshake\r\n' +
                   'Upgrade: WebSocket\r\n' +
                     'Connection: Upgrade\r\n' +
                     '\r\n');
      //socket.close();
      socket.destroy();
      return;
    }
  });
})();
