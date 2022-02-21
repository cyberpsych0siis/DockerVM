import { LabelProvider } from "../DockerClient.js";

export default class VncTraefikProvider extends LabelProvider {
    /**
     * 
     * @param {string} containerName 
     * @param {string} reachableAddress 
     * @param {string} proxyPort 
     * @returns Object
     */
    getProperties(containerName, reachableAddress) {
        return {
            Hostname: containerName,
            Image: "vncserver/lubuntu",
            Labels: {
                "traefik.enable": "true",
                // "traefik.port": "5901",
                ["traefik.tcp.routers." + containerName + ".entrypoints"]: "vnc",
                ["traefik.tcp.routers." + containerName + ".entrypoints.tls"]: "{}",
                ["traefik.tcp.routers." + containerName + ".tls.certresolver"]: "sslresolver",
                ["traefik.tcp.routers." + containerName + ".rule"]: "HostSNI(`" + reachableAddress + "`)",
                ["traefik.tcp.services." + containerName + ".loadbalancer.server.port"]: "5901"
            },
        }
    }
}

export class NoVncTraefikProvider extends LabelProvider {
    /**
     * 
     * @param {string} containerName 
     * @param {string} reachableAddress 
     * @param {string} proxyPort 
     * @returns Object
     */
    getProperties(containerName, reachableAddress) {
        return {
            Image: "jarvis/lubuntu-novnc:latest",
            Labels: {
                "traefik.enable": "true",
                "traefik.port": "80",
                ["traefik.http.routers." + containerName + ".entrypoints"]: "websecure",
                ["traefik.http.routers." + containerName + ".rule"]: "Host(`" + reachableAddress + "`)"
            },
        }
    }
}