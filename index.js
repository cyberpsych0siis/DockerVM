import { WebSocketServer } from 'ws';
import websocketStream from 'websocket-stream/stream.js';
import logger from 'morgan';
import { parse } from 'url';

import express from 'express';
import expressStatic from 'express-static';
import process from 'process';

import DockerClient from './DockerClient.js';
import HttpTraefikProvider from './provider/HttpTraefikProvider.js';
import VncTraefikProvider from './provider/VncTraefikProvider.js';
import axios from 'axios';
import RdpTraefikProvider from './provider/RdpTraefikProvider.js';

(function () {
  const app = express();
  app.use(logger('dev', {
    skip: function (req, res) {
      // console.log(req.url);
      if (req.url == '/health' || req.url == '/') {
        return true;
      } else {
        return false;
      }
    }
  }));

  app.use("/health", (req, res) => {
    res.send({ status: true });
  });
  app.use("/", expressStatic('public'));

  const wss = new WebSocketServer({
    noServer: true
  });

    //our http server which handles websocket proxy and static
    const PORT = process.env.WEBSOCKET_PORT ?? 8085;
    const server = app.listen(PORT, () => { console.log("[WebSocket] Listening to port " + PORT) });/*  */

  //bypass validation for now
  async function validateSession(token) {

    //if no authentication route is configured just bypass authentication
    if (!process.env.AUTHENTICATION_ROUTE) return true;

    // console.log(fetch);

    const serverResponse = await axios.post(process.env.AUTHENTICATION_ROUTE, {token: token});
    // const data = await serverResponse.json();
    console.log(serverResponse);

    return true;
  }

  function getProviderByMessage(msg) {
    console.log(msg);
    if (msg == "") throw new Error("Invalid message");

    const s = msg.split(" ");
    switch (s[1]) {
      case "http":
        return new HttpTraefikProvider();

      case "vnc":
        return new VncTraefikProvider();

      case "rdp":
        return new RdpTraefikProvider();

      default:
        throw new Error("Unknown Provider specified");
    }
  }

  //on new WebSocketServer connection, connect websocket with a new DockerClient instance
  wss.on('connection', function connect(ws) {
    console.log("[WebSocket] New Connection");
    let dClient = null;

    ws.send("Connection established");
    console.log("[WebSocket] connection opened");

    //if our webserver emits an error, print it to stderr
    ws.on('error', err => {
      console.error(err);
    })
      //if the client himself closes the connection, clean up, stop and remove the container
      .on('close', err => {
        console.error("[WebSocket] closing because of " + err);

        let auxContainer;

        if (dClient != null) {
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
            });
        }
      })
      .on("message", (data) => {
        console.log("[WebSocket Client] " + data);

        try {
          let provider = getProviderByMessage(data.toString());
          dClient = new DockerClient(provider);

          dClient.start(websocketStream(ws))
            .then(() => {
              ws.send("New Connection: " + dClient.addr)
            })
            .catch((err) => {
              dClient.stop();
              dClient.remove();
              console.error(err);
              ws.send(err.toString());
            });
        } catch (e) {
          ws.send(e.toString());
        }
      });
  });

  //If our HTTP-Server gets an upgrade check the authorization and if success continue
  server.on('upgrade', (request, socket, head) => {
    let { path } = parse(request.url);

    //Checks if current connection is authorized
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
