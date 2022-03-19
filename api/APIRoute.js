import { assert } from "console";
// import Docker from "dockerode";
import express from "express";
import { isUuid } from "uuidv4";
import Client from "../docker/Client.js";

// import { getProviderById } from "../provider/getProvider.js";
import { HttpTraefikProvider } from "../provider/HttpTraefikProvider.js";
import { NoVncTraefikProvider } from "../provider/VncTraefikProvider.js";
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

    // NoVncTraefikProvider
// new NoVncTraefikProvider    
    // console.log(req.headers);
    newDockerClient
      .createContainer(new HttpTraefikProvider(), req.session.id)
      .then((data) => {
        //cache to redis here?
        const { channels } = data;
        delete data.channels;
        // console.log(channels);

        res.send(data);
      });
  });

  //Get all machines for current user
  api.get("/machine", (req, res) => {
    newDockerClient
      .getAllContainerForUserId(req.session.id)
      .then((c) => {
        console.log(c.length);
        res.send(c.map(e => {
          let proxy = createTicket(e);
          return proxy;
        }));
      })
  });

  //Get Machine Info for UUID
  api.get("/machine/:uuid", (req, res) => {
    assert(isUuid(req.params.uuid));

    newDockerClient.getContainerById(req.params.uuid).then((answer) => {
      if (answer) {
        res.status(200).send(createTicket(answer[0]));
      } else {
        res.status(404).end();
      }
    }).catch(e => {
      console.error(e);
      res.send(e);
    });
  });

  //delete the machine with uuid
  api.delete("/machine/:uuid", (req, res) => {
    assert(isUuid(req.params.uuid));
    newDockerClient.deleteContainer(req.params.uuid);
      res.status(200);
      res.end();
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

const hostRegex = /Host\(`.*`\)/;

function createTicket(container) {
  // container.inspect((container) => {
    // console.log(container.Labels);
  // })

  console.log(container);
  const uuid = container.Labels["com.rillo5000.uuid"];
  // const reachableHostname = container.Labels["traefik.http.routers." + uuid + ".rule"];
  const channels = null;
  let reachableHostname = "incompatible";
  
  const hostRegexResult = hostRegex.exec(container.Labels["traefik.http.routers." + uuid + ".rule"] ?? "");
  if (hostRegexResult !== null) {
    reachableHostname = hostRegexResult[0].split("\`")[1];
  }

  const endpoint = container.Labels["com.rillo5000.endpoint"];
  
  return {
    id: uuid ?? "incompatible",
    name: container.Names[0].split("/").join(""),
    reachableHostname: reachableHostname ?? "incompatible",
    // endpoint: endpoint ?? "incompatible",
    // channels: channels ?? {},
  }
};