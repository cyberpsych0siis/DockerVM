// const Docker = require("dockerode");
import Docker from "dockerode";
// const { uuid } = require("uuidv4");
import { uuid } from "uuidv4";
import { getProviderById } from "./provider/getProvider.js";
// import VsCodeTraefikProvider from "./provider/VsCodeTraefikProvider,";

// import VsCodeTraefikProvider from "../provider/VsCodeTraefikProvider.js";

// Default Payload to be executed when no bootstrap command was found in Environment $BOOTSTRAP
const BOOTSTRAP_NOT_DEFINED =
  "echo 'No command defined. Define $BOOTSTRAP.' && exit 1";

var auth = {
  username: process.env.DOCKER_REGISTRY_USERNAME,
  password: process.env.DOCKER_REGISTRY_PASSWORD,
  serveraddress: process.env.DOCKER_REGISTRY_ADDRESS,
  email: process.env.DOCKER_REGISTRY_EMAIL,
};

/**
 * @deprecated use docker/Client.js
 */
export default class DockerClient {
  options = {
    //reads the docker host socket from the $DOCKER_HOST environment variable. Defaults to '/var/run/docker.sock'
    host: process.env.DOCKER_REMOTE_HOST ?? "/var/run/docker.sock",

    //uses $BOOTSTRAP variable. Gets inserted after '/bin/sh -c'. Defaults to const BOOTSTRAP_NOT_DEFINED
    bootstrapCmd: process.env.BOOTSTRAP ?? BOOTSTRAP_NOT_DEFINED,

    //under which subdomain should the containers be accessible?
    subdomain: process.env.SUBDOMAIN ?? "instance.app.localhost",

    //what network should the new container be attached to?
    networkId: process.env.NETWORK_ID ?? "nginx",

    //the websocket that should be used for communication
    websocket: null,

    //the container id that should be used instead of a created container
    containerId: null,

    provider: null,

    providerProps: null,
  };

  constructor(
    // provider, //discoverability provider
    options = {} //for external support
  ) {
    for (let key of Object.keys(options)) {
      this.options[key] = options[key];
    }

    if (this.options.containerId != null) {
      this.options.provider = getProviderById("http"); //TODO save used provider somewhere
      this.uuid = this.options.containerId;
      // this.provider = LabelProvider.getProviderById("vscode");
    } else {
      this.uuid = uuid();
    }

    this.provider = this.options.provider;

    this.addr = `${this.uuid}.${this.options.subdomain}`;
    console.log("new Container: " + this.addr);

    this.dockerClient = new Docker();
    this.name = this.addr.split("-")[0]; //takes the first part of the uuid v4
    this.providerProps = this.provider?.getProperties(
      String(this.name),
      String(this.addr)
    );
  }

  async createContainer() {
    if (this.options.containerId) {
      console.log("My Container ID: " + this.options.containerId);
      // debugger;
      return this.getContainerByUuid(this.options.containerId);
    } else {
      let properties = {
        name: this.uuid,
        Hostname: this.name,
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
      };

      Object.assign(properties, this.providerProps); //assigns the provider properties to the container properties

      properties.Labels["com.rillo5000.provider"] =
        this.provider.constructor.name;

      return this.dockerClient.createContainer(properties);
    }
  }

  pullImage(logPipe, JsonTemplate) {
    return new Promise((res, rej) => {
      let authObj = this.provider.private ? { authconfig: auth } : {};

      this.dockerClient.pull(
        this.providerProps.Image,
        authObj,
        (err, stream) => {
          // streaming output from pull...
          if (err) {
            // debugger;
            rej(err);
            // return;
          } else {
            // console.log(stream);

            const onFinished = (err, output) => {
              // console.log(output);
              if (err) rej(err);
              res();
            };

            const onProgress = (event) => {
              if (logPipe.writable) {
                const pkg = new JsonTemplate(event);
                logPipe.write(JSON.stringify(pkg));
              }
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

  async stop() {
    if (this.docker != null) {
      await this.docker.stop();
    } else {
      throw new Error("Container is not initialized");
    }
  }

  async start() {
    this.docker = await this.createContainer();

    return new Promise((res, rej) => {
      this.docker.start((err, data) => {
        if (err) console.log(err);

        this.docker.logs(
          {
            follow: true,
            stdout: true,
            stderr: true,
          },
          (err, s) => {
            if (err) rej(err);
            res({
              logStream: s,
              endpoint: this.addr,
            });
          }
        );
      });
    });
  }

  getContainerByUuid(id) {
    return new Promise((res, rej) => {
      // if (!isUuid(req.params.uuid)) {
      // res.status(400).end();
      // res.end();
      // return;
      // rej("invalid uuid");
      // }

      this.dockerClient.listContainers(
        {
          filters: {
            // status: ["exited"],
            name: [id],
          },
        },
        (err, containers) => {
          if (err) {
            // res.send(err);
            console.log(err);
            rej(err);
            // return;
          }

          if (containers.length == 1) {
            // res.send(...containers);
            res(...containers);
            // return;
          } else {
            // res.send(JSON.stringify(new Error("invalid uuid")));
            console.log(containers);
            rej(new Error("container not found"));
            // return;
          }
        }
      );
    });
  }

  /**
   *
   * @returns
   */
  async remove() {
    return await this.docker.remove();
  }
}
