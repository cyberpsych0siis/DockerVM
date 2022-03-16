import { assert } from "console";
import Docker from "dockerode";
import express from "express";
import { isUuid } from "uuidv4";
import Client from "../docker/Client.js";
import DockerClient from "../DockerClient.js";
import expressStatic from "express-static";

import {
  DockerPullLogMessage,
  DockerEndpointCreated,
} from "../lib/Messages.js";

import { getProviderById } from "../provider/getProvider.js";
import { HttpTraefikProvider } from "../provider/HttpTraefikProvider.js";
// import MachineRouter from "./MachineRouter.js";
// import websocketStream from "websocket-stream";

export default (app) => {
  const api = express.Router();

  /*   api.get("/", (req, res) => {
    res.send("Hello World");
  }); */

  let newDockerClient = new Client();

  //create new machine over REST

  api.post("/machine", (req, res) => {
    console.log(req.headers);
    newDockerClient.createContainer(new HttpTraefikProvider()).then((data) => {
      //cache to redis here?
      const { channels } = data;
      delete data.channels;
      // console.log(channels);

      res.send(data);
    });
  });

  api.get("/machine", (req, res) => {
    if (req.session.counter === undefined) {
      req.session.counter = 0;
    }
    req.session.counter++;
    res.send(req.session);
  });

  api.get("/machine/:uuid", (req, res) => {
    console.log(req.headers);
    assert(isUuid(req.params.uuid));

    const answer = newDockerClient.getContainerTicket(req.params.uuid);
    if (answer) {
      res.status(200).send(answer);
    } else {
      res.status(404).end();
    }
    // console.log(answer);

    // res.send(answer);
  });

  api.delete("/machine/:uuid", (req, res) => {
    assert(isUuid(req.params.uuid));
    newDockerClient.deleteContainer(req.params.uuid).then(() => {
      res.status(200);
    });
  });

  // MachineRouter(api, newDockerClient);

  /*   api.ws("/machine/:uuid/:channel", (ws, req) => {
    // res.send("coming soon");
    const { uuid, channel } = req.params;
    const ws_ = newDockerClient.getWebsocketChannel(uuid, channel);
    // ws_.handleUpgrade(req, ws, req.headers, (websocket) => {
    console.log(ws_);
    // });
  });
 */
  /*     expressServer.on("upgrade", (request, socket, head) => {
      websocketServer.handleUpgrade(request, socket, head, (websocket) => {
        websocketServer.emit("connection", websocket, request);
      });
    }); */

  app.use("/api", api);
};
