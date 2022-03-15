import { assert } from "console";
import Docker from "dockerode";
import express from "express";
import { isUuid } from "uuidv4";
import Client from "../docker/Client.js";
import DockerClient from "../DockerClient.js";

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

  api.get("/", (req, res) => {
    res.send("Hello World");
  });

  api.get("/echo/:msg", (req, res) => {
    res.send(req.params);
  });

  let newDockerClient = new Client();

  //create new machine over REST

  api.post("/machine", (req, res) => {
    console.log(api.headers);
    newDockerClient.createContainer(new HttpTraefikProvider()).then((data) => {
      //cache to redis here?
      const { channels } = data;
      delete data.channels;
      // console.log(channels);

      res.send(data);
    });
  });

  // enableWs(api);

  api.get("/machine/:uuid", (req, res) => {
    console.log(req.headers);
    assert(isUuid(req.params.uuid));
    /* newDockerClient.getContainerById(req.params.uuid).then(
      (container) => {
        console.log(container);

        res.send(container);
      },
      () => {
        res.status(404).end();
      }
    ); */
    // res.send(dClient.getContainerByUuid(req.params.uuid));
    res.send(newDockerClient.getContainerTicket(req.params.uuid));
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
