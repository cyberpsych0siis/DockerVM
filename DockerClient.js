const Docker = require("dockerode");
/* const dockerClient = new Docker(/*{
    socketPath: "/var/run/docker.sock",
    version: 'v1.25'
}*); */

// Default Payload to be executed when no bootstrap command was found in Environment $BOOTSTRAP
const BOOTSTRAP_NOT_DEFINED = "bash -i";//"echo 'No command defined. Define $BOOTSTRAP.' && exit 1";

class DockerClient {

    options = {
        //reads the docker host socket from the $DOCKER_HOST environment variable. Defaults to '/var/run/docker.sock'
        host: process.env.DOCKER_REMOTE_HOST ?? '/var/run/docker.sock',
    
        //uses $DOCKER_IMAGE variable. Use in format name:tag. Defaults to 'ubuntu'
        image: process.env.DOCKER_IMAGE ?? 'archlinux',
    
        //uses $BOOTSTRAP variable. Gets inserted after '/bin/sh -c'. Defaults to const BOOTSTRAP_NOT_DEFINED
        bootstrapCmd: process.env.BOOTSTRAP ?? BOOTSTRAP_NOT_DEFINED,
    
        //the websocket that should be used for communication
        websocket: null,
    
        //the container id that should be used instead of a created container - UNUSED
        containerId: null
    }

    constructor(options = {}) {
        for (let key of Object.keys(options)) {
            this.options[key] = options[key];
        }

        this.dockerClient = new Docker();
    }

    async createContainer() {
        console.log("cmd: " + this.options.bootstrapCmd);
        return this.dockerClient.createContainer({
            Image: this.options.image,
            AttachStdin: false,
            AttachStdout: false,
            AttachStderr: false,
            Tty: true,
            // Cmd: ['/bin/sh', '-c', this.options.bootstrapCmd],
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

    async start(pipe) {
        this.docker = await this.createContainer();
        this.container.exec({Cmd: ['/bin/sh', '-c', this.options.bootstrapCmd ], AttachStdin: true, AttachStdout}, function(err, exec) {
            exec.start({hijack: true, stdin: true}, function(err, stream) {
                pipe.pipe(stream);
                this.docker.modem.demuxStream(stream, pipe, process.stderr);
            });
        })
        // console.log(await this.docker.inspect());
        return await this.docker.start();
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
    attach(pipeStreamOut, pipeStreamIn) {
        if (this.docker != null) {
            this.docker.attach({ stream: true, stdout: true, stderr: true, stdin: true }, (err, stream) => {
                console.log("attaching to container");
                // stream.pipe(pipeStreamOut);
                // stream.pipe(process.stdout);
                process.stdin.pipe(stream);
                this.docker.modem.demuxStream(stream, process.stdout, process.stderr);
                // this.docker.
                // pipeStreamOut.pipe(());
            });
        } else throw new Error("Docker Container is not running");
    }
}

module.exports = DockerClient;