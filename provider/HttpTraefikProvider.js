import { LabelProvider } from "../DockerClient.js";

export default class HttpTraefikProvider extends LabelProvider {
    /**
     * 
     * @param {string} containerName 
     * @param {string} reachableAddress 
     * @param {string} proxyPort 
     * @returns Object
     */
    getProperties(containerName, reachableAddress) {
        return {
            Image: "nginx",
            Labels: {
                "traefik.enable": "true",
                "traefik.port": "80",
                ["traefik.http.routers." + containerName + ".entrypoints"]: "web",
                ["traefik.http.routers." + containerName + ".rule"]: "Host(`" + reachableAddress + "`)"
            },
        }
    }
}