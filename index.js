const Docker = require("dockerode");
const dockerClient = new Docker({
  socketPath: "/var/run/docker.sock",
  version: 'v1.25'
});

const WebSocketServer = require('ws').Server;
const websocketStream = require('websocket-stream');
const http = require("http");
const { parse } = require("url");

const express = require("express");
const expressStatic = require("express-static");
//const http = require("http");
//const { parse } = require("url");
const process = require("process");

// Default Payload to be executed when no bootstrap command was found in Environment $BOOTSTRAP
const BOOTSTRAP_NOT_DEFINED = "echo 'No command defined. Define $BOOTSTRAP.' && exit 1";

class DockerClient {
  constructor(options = {

    //reads the docker host socket from the $DOCKER_HOST environment variable. Defaults to '/var/run/docker.sock'
    host: /*process.env.DOCKER_REMOTE_HOST ?? */'/var/run/docker.sock',

    //uses $DOCKER_IMAGE variable. Use in format name:tag. Defaults to 'ubuntu'
    image: process.env.DOCKER_IMAGE ?? 'alpine',

    //uses $BOOTSTRAP variable. Gets inserted after '/bin/sh -c'. Defaults to const BOOTSTRAP_NOT_DEFINED
    bootstrapCmd: process.env.BOOTSTRAP ?? BOOTSTRAP_NOT_DEFINED,

    //the websocket that should be used for communication
    websocket: null,

    //the container id that should be used instead of a created container - UNUSED
    containerId: null
  }) {
    console.assert(options.websocket != null, "options.websocket can't be null!");
    this.options = options;

    this.dockerClient = new Docker({socketPath: options.host});

    //options.websocket.on('open', () => {
    console.log("[WebSocket] connection opened");

    //if our webserver emits an error, print it to stderr
    options.websocket.on('error', err => {
      console.error(err);
    })

    //if the client himself closes the connection, clean up, stop and remove the container
    .on('close', err => {
      console.error("[WebSocket] closing because of " + err);
        this.stop()
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          //options.websocket.close();
          //options.websocket.send("closing");
//        console.log("closing");
        });
    });
  }

  createContainer() {
    return dockerClient.createContainer({
      Image: this.options.image,
      AttachStdin: false,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
//      Cmd: ['echo', 'Hello World', this.options.bootstrapCmd],
      Cmd: 'echo Hello World',
      OpenStdin: true,
      StdinOnce: false
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
    return await this.docker.start();
  }

  async remove() {
    return await this.docker.remove();
  }

  //pipes our docker output stream to the websocket
  attach(pipeStream) {
    if (this.docker != null && this.options.ws != null) {
      this.docker.attach({stream: true, stdout: true, stderr: true}, (err, stream) => {
        console.log("attaching to container");
        //console.log(stream);
        stream.pipe(pipeStream);
      });
    } else throw new Error("Docker or websocket is null");
  }
}

(function() {

  const app = express();
  app.use("/", expressStatic('public'));

  const wss = new WebSocketServer({
    noServer: true
  });

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
      console.error(err);
      ws.send(err.message);
      dClient.remove();
    });
  });

  //our http server which handles websocket proxy and static
  const server = app.listen(process.env.WEBSOCKET_PORT ?? 8085, () => {console.log("Listening")});
  server.on('upgrade', (request, socket, head) => {
    //console.log(request.url);
    let { path } = parse(request.url);

    console.log(path);
    if (path === "/socket") {
      wss.handleUpgrade(request, socket, head, socket => {
        //if the httpServer gets an 'upgrade' event we need to switch our connection
        wss.emit('connection', socket, request);
      });
    }
  });
})();
