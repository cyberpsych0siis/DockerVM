import { LabelProvider } from "../DockerClient.js";

export default class VsCodeTraefikProvider extends LabelProvider {
    /**
     * 
     * @param {string} containerName 
     * @param {string} reachableAddress 
     * @param {string} proxyPort 
     * @returns Object
     */
    getProperties(containerName, reachableAddress) {
        const uuid = reachableAddress.split(".")[0];
        return {
            Image: "cyberpsych0siis/code-server",
            //Cmd: ["/opt/code-server", "--port", "8080"],
            Labels: {
                "traefik.enable": "true",
                "traefik.port": "8080",
                ["traefik.http.routers." + containerName + ".middlewares"]: "strip_then_auth@file",
                ["traefik.http.routers." + containerName + ".entrypoints"]: "web",
                ["traefik.http.routers." + containerName + ".rule"]: "Host(`" + reachableAddress + "`) || PathPrefix(`/" + uuid + "`)"
            },
        }
    }
}
