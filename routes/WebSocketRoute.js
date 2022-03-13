// import WebSocket from "ws";
import { WebSocketServer } from 'ws';
import websocketStream from 'websocket-stream/stream.js';
import DockerClient from '../DockerClient.js';
import HttpTraefikProvider from '../provider/HttpTraefikProvider.js';
import VncTraefikProvider, { NoVncTraefikProvider } from '../provider/VncTraefikProvider.js';
import RdpTraefikProvider from '../provider/RdpTraefikProvider.js';

import VsCodeTraefikProvider from '../provider/VsCodeTraefikProvider.js';

function getProviderByMessage(msg) {
    console.log(msg);
    if (msg == "") throw new Error("Invalid message");

    const s = msg.split(" ");
    switch (s[1]) {
        case "vscode":
            return new VsCodeTraefikProvider();
        case "http":
            return new HttpTraefikProvider();

        // case "vnc":
        // return new VncTraefikProvider();

        // case "rdp":
        // return new RdpTraefikProvider();

        // case "novnc":
        // return new NoVncTraefikProvider();


        default:
            throw new Error("Unknown Provider specified");
    }
}

export default (
    expressServer
) => {
    const websocketServer = new WebSocketServer({
        noServer: true,
        path: "/", 
    });

    expressServer.on("upgrade", (request, socket, head) => {
        websocketServer.handleUpgrade(request, socket, head, (websocket) => {
            websocketServer.emit("connection", websocket, request);
        });
    });

    //on new WebSocketServer connection, connect websocket with a new DockerClient instance
    websocketServer.on('connection', function connect(websocket) {
        console.log("[WebSocket] New Connection");
        let dClient = null;

        // websocket.send("Connection established");
        websocket.send(JSON.stringify(new ConnectionEstablishedMessage()));
        console.log("[WebSocket] connection opened");

        //if our webserver emits an error, print it to stderr
        websocket.on('error', err => {
            console.error(err);
        });

        //if the client himself closes the connection, clean up, stop and remove the container
        websocket.on('close', err => {
            console.error("[WebSocket] closing because of " + err);

            let auxContainer;

            if (dClient.docker != null) {
                dClient.stop()
                    .then((container) => {
                        auxContainer = container;
                        // closed = true;
                        // stream.end();
                    })
                    .catch((err) => {
                        // websocket.send("[WebSocket] connection closed");
                        console.error(err);
                    })
                    .finally(() => {
                        //cleanup
                        // if (dClient.docker) {
                            dClient.remove();
                        // }
                    });
            }
        });
        websocket.on("message", async (data) => {
            console.log("[WebSocket Client] " + data);

            try {
                let provider = getProviderByMessage(data.toString());
                dClient = new DockerClient(provider);

                dClient.pullImage(websocketStream(websocket), DockerPullLogMessage)
                .then(() => {
                    dClient.start()
                        .then((logStream) => {
                            logStream.on("data", d => {
                                // console.log();
                                websocket.send(JSON.stringify(new DockerLogMessage(d.toString())));
                            });
                        })
                        .catch((err) => {
                            dClient.stop();
                            dClient.remove();
                            console.error(err);
                            websocket.send(JSON.stringify(new WebsocketError(err)));
                        });
                    }).catch(err => {
                        websocket.send(JSON.stringify(new WebsocketError(err)));
                        console.error(err);
                    });
            } catch (e) {
                websocket.send(JSON.stringify(new WebsocketError(e)));
            }
        });
    });

    return websocketServer;
};

export class Message {
    constructor(type, msg) {
        this.type = type;
        this.msg = msg;
    }
}

class InstanceStartedMessage extends Message {
    constructor(url) {
        super("conn", url);
    }
}

class WebsocketError extends Message {
    constructor(err) {
        super("err", err.message);
    }
}

class DockerLogMessage {
    constructor(msg) {
        // console.log(msg);
        this.type = "logchunk";
        this.msg = msg;
        // super("msg", msg);
    }
}

class DockerPullLogMessage extends Message {
    constructor(msg) {
        // this.type = "pullchunk";
        super("pullchunk", msg.status);
        // Object.assign(this, msg);
    }
}

class ConnectionEstablishedMessage extends Message {
    constructor() {
        super("hello", "Connection established");
    }
}
