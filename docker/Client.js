import { WebSocketServer } from "ws";
import { assert } from "console";
import { isUuid, uuid } from "uuidv4";
import Docker from "dockerode";
import { mergeDeep } from "../utils/DeepCopySO.js";

export default class Client {
  options = {
    //under which subdomain should the containers be accessible?
    subdomain: process.env.SUBDOMAIN ?? "instance.app.localhost",

    //what network should the new container be attached to?
    networkId: process.env.NETWORK_ID ?? "nginx",
  };

  tickets = {};

  constructor(options = {}) {
    //Apply Options Arguments to Options Object
    for (let key of Object.keys(options)) {
      this.options[key] = options[key];
    }

    this.dockerClient = new Docker();
  }

  async createContainer(provider, ownerId = 0, pathPrefix = "/api/machine") {
    //First create websockets for communication (log, pull, etc)
    const newUuid = uuid();
    const reachableHostname = `${newUuid}.${this.options.subdomain}`;
    const socketAddress = pathPrefix + "/" + newUuid;

    const channels = {
      log: new WebSocketServer({
        noServer: true,
        path: socketAddress,
      }),
    };

    let properties = {
      name: "I am a stegosaurus",
      Hostname: newUuid.split("-")[0],
      AttachStdin: false,
      AttachStdout: false,
      AttachStderr: false,
      Tty: true,
      OpenStdin: false,
      StdinOnce: false,
      NetworkingConfig: {
        EndpointsConfig: {
          [this.options.networkId]: {},
        },
      },
      Labels: {
        "com.rillo5000.uuid": String(newUuid),
        "com.rillo5000.ownerId": String(ownerId),
        "com.rillo5000.endpoint": String(socketAddress)
      },
    };

    const providerProperties = provider.getProperties(
      String(properties.name),
      String(reachableHostname)
    );

    mergeDeep(properties, providerProperties);

    this.pullImage(provider).then(() => {
      return this.dockerClient.createContainer(properties);
    }).then(container => {
      container.start();
    });

    const ticket = {
      id: newUuid,
      reachableHostname: reachableHostname,
      socket: socketAddress
    };

    // this.channels[newUuid] = ticket;
    this.tickets[newUuid] = ticket;

    return ticket;
  }

  async startContainer(id) {
    const container = await this.getContainerById(id);
    container.start();
  }

  /**
   * @deprecated
   * @param {*} id
   * @returns
   */
  getContainerTicket(id) {
    return this.tickets[id];
  }

  async getAllContainerForUserId(userId) {

    return this.dockerClient.listContainers({
      all: true,
      filters: {
        label: ["com.rillo5000.ownerId=" + userId]
      }
    });
  }

  async getContainerById(uuid) {
    assert(isUuid(uuid));

    return this.dockerClient.listContainers({
        all: true,
        filters: {
          label: ["com.rillo5000.uuid=" + uuid],
        },
      });
  }

  async deleteContainer(id) {
    this.getContainerById(id).then(
      (container) => {
        // container.stop()
        container.remove();
      },
      (err) => {}
    );
  }

  pullImage(provider) {
    // console.log(provider);

    // const properties = getProperties(containerName, reachableAddress) {

    return new Promise((res, rej) => {
      this.dockerClient.pull(
        provider.Image, //TODO check
        provider.getAuthentication(),
        (err, stream) => {
          if (err) {
            console.error(err);
          } else {
            /*ws.on("connection", (ws) => {
                            const wsStream = websocketStream(ws);
                        });*/

            const onFinished = (err, output) => {
              if (err) console.error(err);
              console.log(output);
              res();
            };

            const onProgress = (event) => {
              console.log(event);
            };

            this.dockerClient.modem.followProgress(
              stream,
              onFinished,
              onProgress
            );
          }
        }
      );
    });
  }

  getWebsocketChannel(id, channel) {
    if (this.channels[id] && this.channels[id][channel]) {
      return this.channels[id][channel];
    } else {
      throw new Error("No channel for this uuid found");
    }
  }
}
