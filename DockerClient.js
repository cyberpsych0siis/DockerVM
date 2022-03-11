// const Docker = require("dockerode");
import Docker from 'dockerode';
// const { uuid } = require("uuidv4");
import { uuid } from 'uuidv4';

// import { Message } from './routes/WebSocketRoute.js';

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
        containerId: null,

        providerProps: null
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
        this.providerProps = this.provider?.getProperties(
            String(this.name),
            String(this.addr)
        );
    }

    async createContainer() {

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

        Object.assign(properties, this.providerProps);   //assigns the provider properties to the container properties


        return this.dockerClient.createContainer(properties);
    }

    pullImage(logPipe, JsonTemplate) {
        return new Promise((res, rej) => {

            this.dockerClient.pull(this.providerProps.Image, /* {authconfig: auth}, */ (err, stream) => {
                // streaming output from pull...
                if (err) throw err;
                console.log(stream);

                const onFinished = (err, output) => {
                    // console.log(output);
                    if (err) rej(err);
                    res();
                }

                const onProgress = (event) => {
                    if (logPipe.writable) {
                        const pkg = new JsonTemplate(event);
                        logPipe.write(JSON.stringify(pkg));
                    }
                }

                this.dockerClient.modem.followProgress(stream, onFinished, onProgress);
            });
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

                this.docker.logs({
                    "follow": true,
                    "stdout": true,
                    "stderr": true
                }, (err, s) => {
                    if (err) rej(err);
                    res(s);

                });
            });
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