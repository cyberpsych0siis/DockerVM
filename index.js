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

    //options.websocket.on('open', () => {
    console.log("[WebSocket] connection opened");

    //if our webserver emits an error, print it to stderr
    ws.on('error', err => {
      console.error(err);
    })
      //if the client himself closes the connection, clean up, stop and remove the container
      .on('close', err => {
        console.error("[WebSocket] closing because of " + err);

        dClient.stop()
        .then((container) => {
          return container.remove();
        })
          .catch((err) => {
            console.error(err);
          })
          .finally(() => {
            //cleanup
            // dClient.remove();
          });
      })
      .on("message", (data) => {
        console.log("[WebSocket Client] " + data);
      })

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
  const PORT = process.env.WEBSOCKET_PORT ?? 8085;
  const server = app.listen(PORT, () => { console.log("[WebSocket] Listening to port " + PORT) });
  server.on('upgrade', (request, socket, head) => {
    let { path } = parse(request.url);

    //console.log(request.headers);

    if (validateSession(request.headers.cookie)) {
      if (path === "/socket") {
        wss.handleUpgrade(request, socket, head, socket => {
          //if the httpServer gets an 'upgrade' event we need to switch our connection
          wss.emit('connection', socket, request);
        });
      }
    } else {

      socket.write('HTTP/1.1 403 Forbidden\r\n');
/*       socket.write('HTTP/1.1 401 Web Socket Protocol Handshake\r\n' +
        'Upgrade: WebSocket\r\n' +
        'Connection: Upgrade\r\n' +
        '\r\n'); */
      //socket.close();
      socket.destroy();
      return;
    }
  });
})();
