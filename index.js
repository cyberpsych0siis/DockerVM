const WebSocketServer = require('ws').Server;
const websocketStream = require('websocket-stream/stream');
const http = require("http");
const logger = require("morgan");
const { parse } = require("url");

const express = require("express");
const expressStatic = require("express-static");
const process = require("process");

const DockerClient = require("./DockerClient.js");

const fs = require("fs");

(function () {
  const app = express();
  app.use(logger('dev'));

  app.use("/health", (req, res) => {
    res.send({ status: true });
  });
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
    let dClient = new DockerClient();

    //options.websocket.on('open', () => {
    ws.send("[WebSocket] connection opened");
    console.log("[WebSocket] connection opened");

    //if our webserver emits an error, print it to stderr
    ws.on('error', err => {
      console.error(err);
    })
      //if the client himself closes the connection, clean up, stop and remove the container
      .on('close', err => {
        console.error("[WebSocket] closing because of " + err);

        let auxContainer;

        dClient.stop()
          .then((container) => {
            auxContainer = container;
          })
          .catch((err) => {
            ws.send("[WebSocket] connection closed");
            console.error(err);
          })
          .finally(() => {
            //cleanup
            dClient.remove();
            // auxContainer.stop();
            // auxContainer.remove();
            // container.remove();
          });
      })
      .on("message", (data) => {
        console.log("[WebSocket Client] " + data);
      })

    dClient.start(websocketStream(ws))/* .then((container) => {
      dClient.attach(websocketStream(ws));
    }) */
    .then(() => {
      ws.send("New Connection: " + dClient.addr)
    })
      .catch((err) => {
        dClient.stop();
        dClient.remove();
        console.error(err);
        ws.send(err.toString());
      });
  });

  //our http server which handles websocket proxy and static
  const PORT = process.env.WEBSOCKET_PORT ?? 8085;
  const server = app.listen(PORT, () => { console.log("[WebSocket] Listening to port " + PORT) });

  //If our HTTP-Server gets an upgrade check the authorization and if success continue
  server.on('upgrade', (request, socket, head) => {
    let { path } = parse(request.url);

    if (validateSession(request.headers.cookie)) {
      if (path === "/socket" || path === "/") {
        wss.handleUpgrade(request, socket, head, socket => {
          //if the httpServer gets an 'upgrade' event we need to switch our connection
          wss.emit('connection', socket, request);
        });
      }
    } else {
      socket.write('HTTP/1.1 401 Unauthorized\r\n');
      console.log("unauthorized");
      socket.destroy();
      return;
    }
  });
})();
