const Docker = require("dockerode");
const dockerClient = new Docker({socketPath: "/var/run/docker.sock"});
const WebSocketServer = require('ws').Server;
const websocketStream = require('websocket-stream');
const express = require("express");
const expressStatic = require("express-static");
const http = require("http");
const { parse } = require("url");
const process = require("process");

// Default Payload to be executed when no bootstrap command was found in Environment $BOOTSTRAP
const BOOTSTRAP_NOT_DEFINED = "echo 'No command defined. Define $BOOTSTRAP.' && exit 1";

class DockerClient {
  constructor(options = {

    //reads the docker host socket from the $DOCKER_HOST environment variable. Defaults to '/var/run/docker.sock'
    host: process.env.DOCKER_HOST ?? '/var/run/docker.sock',

    //uses $DOCKER_IMAGE variable. Use in format name:tag. Defaults to 'ubuntu'
    image: process.env.DOCKER_IMAGE ?? 'ubuntu',

    //uses $BOOTSTRAP variable. Gets inserted after '/bin/sh -c'. Defaults to const BOOTSTRAP_NOT_DEFINED
    bootstrapCmd: process.env.BOOTSTRAP ?? BOOTSTRAP_NOT_DEFINED,

    //the websocket that should be used for communication
    websocket: null,

    //the container id that should be used instead of a created container
    containerId: null
  }) {
    console.assert(options.websocket != null, "options.websocket can't be null!");
    // console.log(options.host);
    this.options = options;

    //options.websocket.on('open', () => {
      console.log("[WebSocket] connection opened");

      //we got a containerId in the options object, connect to it instead of creating a new container
//      let container = (this.options.containerId !== null) ? this.getContainer(this.options.containerId) ?? (function(){
/*      this.createContainer().then(async container => {
        console.log("container creation succeeded");
        this.docker = container;
        console.log(await container.stats());
        this.attach();
        //container.start();
      });*/
    //let c = this.createContainer();
    //console.log(c);
    //})
    options.websocket.on('error', err => {
      console.error(err);
    }).on('close', err => {
      console.error("[WebSocket] closing because of " + err);
      if (this.docker != null) {
        this.docker.stop();
        this.docker.remove();
      }
    });
  }

  createContainer() {
    return dockerClient.createContainer({
      Image: this.options.image,
      AttachStdin: false,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
      Cmd: ['/bin/sh', '-c', this.options.bootstrapCmd],
      OpenStdin: false,
      StdinOnce: false
    });
  }

  async start() {
    let container = await this.createContainer();
    return await container.start();
  }

  attach(pipeStream) {
    //if (this.docker != null && this.options.ws != null) {
      this.docker.attach({stream: true, stdout: true, stderr: true}, (err, stream) => {
        console.log("attaching to container");
        //console.log(stream);
        stream.pipe(pipeStream);
      });
    //} else throw new Error("Either docker wasn't ready or the websocket object was null");
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

    try {
      dClient.start().then((container) => {
        //container.attach(websocketStream(ws));
//        container.attach(
      });
    } catch (e) {
      console.error(e);
      ws.send(e);
    }

    ws.on('close', () => {
      console.log('goodbye');
    });
  });

  const server = app.listen(process.env.WEBSOCKET_PORT ?? 8085, () => {console.log("Listening")});
    server.on('upgrade', (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, socket => {
      //if the httpServer gets an 'upgrade' event we need to switch our connection
        wss.emit('connection', socket, request);
      });
    });
})();
