// const Docker = require("dockerode");
import Docker from 'dockerode';
// const { uuid } = require("uuidv4");
import { uuid } from 'uuidv4';

// import os from 'os';

// Default Payload to be executed when no bootstrap command was found in Environment $BOOTSTRAP
const BOOTSTRAP_NOT_DEFINED = "echo 'No command defined. Define $BOOTSTRAP.' && exit 1";

export default class DockerClient {

    options = {
        //reads the docker host socket from the $DOCKER_HOST environment variable. Defaults to '/var/run/docker.sock'
        host: process.env.DOCKER_REMOTE_HOST ?? '/var/run/docker.sock',

        //uses $BOOTSTRAP variable. Gets inserted after '/bin/sh -c'. Defaults to const BOOTSTRAP_NOT_DEFINED
        bootstrapCmd: process.env.BOOTSTRAP ?? BOOTSTRAP_NOT_DEFINED,

        //under which subdomain should the containers be accessible?
        subdomain: process.env.SUBDOMAIN ?? "instance.app.localhost",

        //what network should the new container be attached to?
        networkId: process.env.NETWORK_ID ?? "nginx",

        //the websocket that should be used for communication
        websocket: null,

        //the container id that should be used instead of a created container - UNUSED
        containerId: null
    }

    constructor(
        provider,       //discoverability provider
        options = {},   //for external support
    ) {
        for (let key of Object.keys(options)) {
            this.options[key] = options[key];
        }

        this.provider = provider;
        this.dockerClient = new Docker();
        this.addr = `${uuid()}.${this.options.subdomain}`;
        this.name = this.addr.split("-")[0];    //takes the first part of the uuid v4
    }

    async createContainer(cbUrl) {
        let properties = {
            Hostname: this.name,
            AttachStdin: false,
            AttachStdout: false,
            AttachStderr: false,
            Tty: true,
            OpenStdin: false,
            StdinOnce: false,
            NetworkingConfig: {
                "EndpointsConfig": {
                    [this.options.networkId]: {

                    }
                }
            }
        };

        Object.assign(properties, this.provider?.getProperties(
            String(this.name),
            String(this.addr)
        ));   //assigns the provider properties to the container properties

        
        if (cbUrl) {
            console.log(cbUrl);

            const BASE_URI = this.addr.split(".")[0];
            
            properties.Env = [
                `CALLBACK_ENDPOINT=${cbUrl}`,
                `ENDPOINT_URI=${this.addr}`,
                `ENDPOINT_BASE_URI=/${BASE_URI}`
            ];

            // properties.Cmd = `curl ${cbUrl}/bootstrap | sh -`;
        }
        console.log(properties);

        return this.dockerClient.createContainer(properties);
    }

    async stop() {
        if (this.docker != null) {
            await this.docker.stop();
        } else {
            throw new Error("Container is not initialized");
        }
    }

    async start(pipe, callbackUrl) {
        this.docker = await this.createContainer(callbackUrl);
        return this.docker.start((data) => {
            this.docker.exec({ Cmd: [this.options.bootstrapCmd], AttachStdin: true, AttachStdout: true }, (err, exec) => {
                if (err) throw err;

                console.log("[DockerClient] Attaching new Container to " + this.addr);

                exec.start({ hijack: true, stdin: true, stdout: true, stderr: true }, (err, stream) => {
                    if (pipe) {
                        pipe.pipe(stream);
                        this.docker.modem.demuxStream(stream, pipe, pipe);
                    }
                });

            })
        });
    }

    /**
     *
     * @deprecated
     * @returns
     */
    async remove() {
        if (this.docker != null) {
            return await this.docker.remove();
        }
    }
}

export class LabelProvider {

    /**
     * Should return options on how the element is connected to the proxy
     */
    getProperties(
        containerName,      //The name of the container (typically the first part of a UUID)
        reachableAddress    //external address thats used to connect to the client
    ) {
        return {}
    }

    setWebsocket(ws) {

    }
}

/* exports.default = DockerClient;
exports.LabelProvider = LabelProvider; */
