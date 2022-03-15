// import WebSocket from "ws";
import { WebSocketServer } from "ws";
// import websocketStream from "websocket-stream/stream.js";
// import { parse } from "path";

import { ConnectionEstablishedMessage } from "../lib/Messages.js";

import StartRoute from "./websocket/StartRoute.js";

export default (expressServer) => {
  const websocketServer = new WebSocketServer({
    noServer: true,
    path: "/socket",
  });

  expressServer.on("upgrade", (request, socket, head) => {
    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      websocketServer.emit("connection", websocket, request);
    });
  });

  //on new WebSocketServer connection, connect websocket with a new DockerClient instance
  websocketServer.on("connection", function connect(websocket) {
    console.log("[WebSocket] New Connection");
    let dClient = null;

    // websocket.send("Connection established");
    websocket.send(JSON.stringify(new ConnectionEstablishedMessage()));
    console.log("[WebSocket] connection opened");

    //if our webserver emits an error, print it to stderr
    websocket.on("error", (err) => {
      console.error(err);
    });

    //if the client himself closes the connection, clean up, stop and remove the container
    websocket.on("close", (err) => {
      // StopRoute(websocket, data);
    });
    websocket.on("message", async (data) => {
      console.log("[WebSocket Client] " + data);

      //parse message
      // let cmd = parse(data);
      let split = data.toString().split(" ");

      switch (split[0]) {
        case "start":
          StartRoute(websocket, split[1]);
          break;

        case "stop":
          StopRoute(websocket, data);
          break;
      }
    });
  });

  return websocketServer;
};
