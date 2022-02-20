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

    constructor(options = {}) {
        for (let key of Object.keys(options)) {
            this.options[key] = options[key];
        }

        this.dockerClient = new Docker();
        this.addr = `${uuid()}.${this.options.subdomain}`;
        this.name = this.addr.split("-")[0];
        console.log(this.name);
    }

    async createContainer() {
        // console.log("cmd: " + this.options.bootstrapCmd);
        // let addr = ;
        console.log("[DockerClient]Attaching new Container to " + this.addr)
        return this.dockerClient.createContainer({
            Image: this.options.image,
            AttachStdin: false,
            AttachStdout: false,
            AttachStderr: false,
            Tty: true,
            OpenStdin: false,
            StdinOnce: false,
            Env: [
                `VIRTUAL_HOST=${this.addr}`,      //compatible with jwilder/nginx-proxy - test pls
                `VIRTUAL_PORT=${this.options.exposedPort}`
            ],
            Labels: {
                // tcp:
                // `services.my-service.loadBalancer.servers.address=<private-ip-server-1>:<private-port-server-1>`
                "traefik.enable": "true",
                "traefik.port": this.options.exposedPort,
                // ["traefik.tcp.routers." + this.name + ".entrypoints"]: "ssh",
                // ["traefik.tcp.routers." + this.name + ".rule"]: "HostSNI(`" + this.addr + "`)"
                "traefik.http.routers.http.entrypoints": "web",
                "traefik.http.routers.http.rule": "Host(`" + this.addr + "`)"
                // "traefik.tcp.routers." + this.name + ".service=",
            },
            NetworkingConfig: {
                "EndpointsConfig": {
                    [this.options.networkId]: {

                    }
                }
            }
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
        return this.docker.start((data) => {
            this.docker.exec({Cmd: ['/bin/sh', '-c', this.options.bootstrapCmd ], AttachStdin: true, AttachStdout: true}, (err, exec) => {
                if (err) throw err;

//                console.log(this.options.bootstrapCmd);
//		console.log(exec);

                exec.start({hijack: true, stdin: true}, (err, stream) => {
                    pipe.pipe(stream);
                    this.docker.modem.demuxStream(stream, pipe, process.stderr);
                });
            })
        });
        // console.log(await this.docker.inspect());
        // return await this.docker.start();
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
    /**
     *
     * @deprecated
     */
    attach(pipeStreamOut, pipeStreamIn) {
        if (this.docker != null) {
            this.docker.attach({ stream: true, stdout: true, stderr: true, stdin: true }, (err, stream) => {
                console.log("attaching to container");
                // stream.pipe(pipeStreamOut);
                // stream.pipe(process.stdout);
                process.stdin.pipe(stream);
                this.docker.modem.demuxStream(stream, pipe, pipe);
                // this.docker.
                // pipeStreamOut.pipe(());
            });
        } else throw new Error("Docker Container is not running");
    }
}

module.exports = DockerClient;
