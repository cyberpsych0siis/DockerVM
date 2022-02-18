const Docker = require("dockerode");
const dockerClient = new Docker({
    socketPath: "/var/run/docker.sock",
    version: 'v1.25'
});

// Default Payload to be executed when no bootstrap command was found in Environment $BOOTSTRAP
const BOOTSTRAP_NOT_DEFINED = "echo 'No command defined. Define $BOOTSTRAP.' && exit 1";

class DockerClient {
    constructor(options = {

        //reads the docker host socket from the $DOCKER_HOST environment variable. Defaults to '/var/run/docker.sock'
        host: process.env.DOCKER_REMOTE_HOST ?? '/var/run/docker.sock',

        //uses $DOCKER_IMAGE variable. Use in format name:tag. Defaults to 'ubuntu'
        image: process.env.DOCKER_IMAGE ?? 'jarvis/testvm',

        //uses $BOOTSTRAP variable. Gets inserted after '/bin/sh -c'. Defaults to const BOOTSTRAP_NOT_DEFINED
        bootstrapCmd: process.env.BOOTSTRAP ?? BOOTSTRAP_NOT_DEFINED,

        //the websocket that should be used for communication
        websocket: null,

        //the container id that should be used instead of a created container - UNUSED
        containerId: null
    }) {
        // console.assert(options.websocket != null, "options.websocket can't be null!");
        this.options = options;

        this.dockerClient = new Docker({ socketPath: options.host });
    }

    async createContainer() {
        console.log("cmd: " + this.options.bootstrapCmd);
        return dockerClient.createContainer({
            Image: this.options.image,
            AttachStdin: false,
            AttachStdout: false,
            AttachStderr: false,
            Tty: false,
            // Cmd: ['/bin/sh', '-c', 'echo "Hello world"'],
            Cmd: ['ls', '-la'],
            //Cmd: 'echo Hello World',
            OpenStdin: false,
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
        console.log(await this.docker.inspect());
        return this.docker.start();
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

    //pipes our docker output stream to the websocket
    attach(pipeStream) {
        if (this.docker != null) {
            this.docker.attach({ stream: true, stdout: true, stderr: true }, (err, stream) => {
                console.log("attaching to container");
                //console.log(stream);
                stream.pipe(pipeStream);
            });
        } else throw new Error("Docker Container is not running");
    }
}

module.exports = DockerClient;
