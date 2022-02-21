/**
 *       - traefik.port=3389
      - traefik.tcp.routers.xrdp.entrypoints=rdp
      - traefik.tcp.routers.xrdp.rule=HostSNI(`rdp.localhost`)
      - traefik.tcp.routers.xrdp.service=xrdp
      - traefik.tcp.services.xrdp.loadbalancer.server.port=3389
 */

import { LabelProvider } from "../DockerClient.js";

export default class RdpTraefikProvider extends LabelProvider {
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
            Image: "frxyt/xrdp:xfce",
            Labels: {
                "traefik.enable": "true",
                "traefik.port": "3389",
                ["traefik.tcp.routers." + containerName + ".entrypoints"]: "rdp",
                ["traefik.tcp.routers." + containerName + ".entrypoints.tls"]: "{}",
                ["traefik.tcp.routers." + containerName + ".rule"]: "HostSNI(`" + reachableAddress + "`)",
                // ["traefik.tcp.routers." + containerName + ".service"]: containerName,
                ["traefik.tcp.services." + containerName + ".loadbalancer.server.port"]: "3389"
            },
        }
    }
}