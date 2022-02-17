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
    console.log(options.host);
    this.options = options;

    //options.websocket.on('open', () => {
      console.log("[WebSocket] connection opened");

      //we got a containerId in the options object, connect to it instead of creating a new container
//      let container = (this.options.containerId !== null) ? this.getContainer(this.options.containerId) ?? (function(){
//  console.log("Hello");
//})(): this.createContainer();
      this.createContainer().then(container => {
        this.docker = container;
        this.docker.start();
        //try {
          //this.startContainer().then((container) => {
            //this.docker = container;
          //});
          this.attach();
//        } catch (e) {
//          options.websocket.send(e.getMessage());
//          console.error(e);
//        }
      });
    //})
    options.websocket.on('error', err => {
      console.err(err);
    }).on('close', err => {
      console.err("[WebSocket] closing because of " + err);
      if (this.docker != null) {
        this.docker.stop();
        this.docker.remove();
      }
    });
  }

  createContainer() {
    return dockerClient.createContainer({
      Image: this.options.image,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
      Cmd: ['/bin/bash', '-c', this.options.bootstrapCmd],
      OpenStdin: false,
      StdinOnce: false
    }).then(container => {
      process.on('beforeExit', (code) => {
        console.log(`[container ${container.id}] Process beforeExit event with code: `, code);
        return container;
      });
    });
  }

  startContainer() {
//    if (this.docker != null) {
      this.docker.start();
  //  } else throw new Error("Container was null");
  }

  attach() {
    //if (this.docker != null && this.options.ws != null) {
      this.docker.attach({stream: true, stdout: true, stderr: true}, function (err, stream) {
        console.log("attaching to container");
        stream.pipe(websocketStream(this.options.websocket));
      });
    //} else throw new Error("Either docker wasn't ready or the websocket object was null");
  }
}

(function() {

  const app = express();
  app.use("/", expressStatic('public'));
  //app.use(httpServer);

  //instanciate a new http server
  const httpServer = http.createServer(app);

  //instantiate a new WebSocketServer
  const wss = new WebSocketServer({
    noServer: true
  });

  //on new WebSocketServer connection, connect websocket with a new DockerClient instance
  wss.on('connection', function connect(ws) {
    console.log("New Connection", ws);
    let dClient = new DockerClient({
      websocket: ws
    });
    ws.on('close', () => {
      console.log('goodbye');
    });
  });

  //if the httpServer gets an 'upgrade' event we need to switch our connection to our websocket.
  httpServer.on('upgrade', function upgrade(request, socket, head) {
    console.log("upgrade request");
    //get property pathname of parse return object
    const { pathname } = parse(request.url);
    console.log(pathname);

    //if the http request was for our path defined in $WEBSOCKET_PATH, we hand over the connection to our server
    if (pathname === process.env.WEBSOCKET_PATH ?? "/") {
      wss.handleUpgrade(request, socket, head, function done(ws) {

        //forward connection request
        wss.emit('connection', ws, request);
      });

    //request was not for our server, destroy the socket to free the resources
    } else {
      socket.destroy();
    }
  });

  httpServer.on('close', function() {
    console.log("[WebSocket] closing...");
    httpServer.destroy();
  });

  const PORT = process.env.WEBSOCKET_PORT ?? 8085;
  httpServer.listen(PORT, () => {
    console.log("[WebSocket] Listening on *:" + PORT);
  });

  //Serve Static Content
  /*const app = express();
  app.use("/", expressStatic('public'));
  app.use(httpServer);*/
//  console.log(app);
  //app.listen(4000, () => {
  //  console.log("listening to *:4000");
  //});
})();
