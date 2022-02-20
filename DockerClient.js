const Docker = require("dockerode");
const { uuid } = require("uuidv4");

// Default Payload to be executed when no bootstrap command was found in Environment $BOOTSTRAP
const BOOTSTRAP_NOT_DEFINED = "echo 'No command defined. Define $BOOTSTRAP.' && exit 1";

class DockerClient {

    options = {
        //reads the docker host socket from the $DOCKER_HOST environment variable. Defaults to '/var/run/docker.sock'
        host: process.env.DOCKER_REMOTE_HOST ?? '/var/run/docker.sock',

        //uses $DOCKER_IMAGE variable. Use in format name:tag. Defaults to 'ubuntu'
        image: process.env.DOCKER_IMAGE ?? 'ubuntu',

        //uses $BOOTSTRAP variable. Gets inserted after '/bin/sh -c'. Defaults to const BOOTSTRAP_NOT_DEFINED
        bootstrapCmd: process.env.BOOTSTRAP ?? BOOTSTRAP_NOT_DEFINED,

        //under which subdomain should the containers be accessible?
        subdomain: process.env.SUBDOMAIN ?? "s.rillo5000.com",

        //what port should be exposed?
        exposedPort: process.env.EXPOSED_PORT ?? 22,

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

    async createContainer() {
        console.log("[DockerClient] Attaching new Container to " + this.addr)
        let properties = {
            Image: this.options.image,
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
            String(this.addr),
            String(this.options.exposedPort)
        ));   //assigns the provider properties to the container properties

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

    async start(pipe) {
        this.docker = await this.createContainer();
        return this.docker.start((data) => {
            this.docker.exec({ Cmd: ['/bin/sh', '-c', this.options.bootstrapCmd], AttachStdin: true, AttachStdout: true }, (err, exec) => {
                if (err) throw err;

                exec.start({ hijack: true, stdin: true }, (err, stream) => {
                    pipe.pipe(stream);
                    this.docker.modem.demuxStream(stream, pipe, process.stderr);
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

module.exports = DockerClient;