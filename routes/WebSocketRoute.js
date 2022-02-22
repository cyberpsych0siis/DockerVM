// import WebSocket from "ws";
import { WebSocketServer } from 'ws';
import websocketStream from 'websocket-stream/stream.js';
import DockerClient from '../DockerClient.js';
import HttpTraefikProvider from '../provider/HttpTraefikProvider.js';
import VncTraefikProvider, { NoVncTraefikProvider } from '../provider/VncTraefikProvider.js';
import RdpTraefikProvider from '../provider/RdpTraefikProvider.js';

import os from 'os';

function getProviderByMessage(msg) {
    console.log(msg);
    if (msg == "") throw new Error("Invalid message");

    const s = msg.split(" ");
    switch (s[1]) {
        case "http":
            return new HttpTraefikProvider();

        case "vnc":
            return new VncTraefikProvider();

        case "rdp":
            return new RdpTraefikProvider();

        case "novnc":
            return new NoVncTraefikProvider();

        default:
            throw new Error("Unknown Provider specified");
    }
}

const cbStack = {};

export const callbackRoute = (req, res) => {
    // console.log(req.body);
    // console.log("Machine ID " + req.body.id + " is ready");
    // console.log(cbStack);
    cbStack[req.body.id].send(req.body.id);
    res.status(200);
}

export const serveBootstrapRoute = (req, res) => {
    res.setHeader("Content-Type", "plain/text");
    res.send(`#!/bin/sh\nexport HOSTNAME = $(cat /etc/hostname) && curl -X POST $CALLBACK_ENDPOINT -d "id=$HOSTNAME" -d "payload=$ENDPOINT_URI"`);
}

export default (
    expressServer
) => {
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
    websocketServer.on('connection', function connect(websocket) {
        console.log("[WebSocket] New Connection");
        let dClient = null;

        websocket.send("Connection established");
        console.log("[WebSocket] connection opened");

        //if our webserver emits an error, print it to stderr
        websocket.on('error', err => {
            console.error(err);
        });

        //if the client himself closes the connection, clean up, stop and remove the container
        websocket.on('close', err => {
            console.error("[WebSocket] closing because of " + err);

            let auxContainer;

            if (dClient != null) {
                dClient.stop()
                    .then((container) => {
                        auxContainer = container;
                    })
                    .catch((err) => {
                        websocket.send("[WebSocket] connection closed");
                        console.error(err);
                    })
                    .finally(() => {
                        //cleanup
                        dClient.remove();
                    });
            }
        });
        websocket.on("message", (data) => {
            console.log("[WebSocket Client] " + data);

            try {
                let provider = getProviderByMessage(data.toString());
                dClient = new DockerClient(provider);

                cbStack[dClient.name] = websocket;

                dClient.start(websocketStream(websocket), `${os.hostname()}:${(process.env.WEBSOCKET_PORT ?? 8085)}`)
                    .then(() => {
                        // websocket.send("New Connection: " + dClient.addr)
                        websocket.send("Starting your instance... " + dClient.addr);
                    })
                    .catch((err) => {
                        dClient.stop();
                        dClient.remove();
                        console.error(err);
                        websocket.send(err.toString());
                    });
            } catch (e) {
                websocket.send(e.toString());
            }
        });
    });

    return websocketServer;
};
