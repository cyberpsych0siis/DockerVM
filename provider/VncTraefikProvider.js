const LabelProvider = require("../LabelProvider.js");

module.exports = class VncTraefikProvider extends LabelProvider {
    /**
     * 
     * @param {string} containerName 
     * @param {string} reachableAddress 
     * @param {string} proxyPort 
     * @returns Object
     */
    getProperties(containerName, reachableAddress) {
        console.debug("This method is not implemented yet and returns default values for http service. dont use for now thx");
        return {
            Hostname: containerName,
            Image: "vncserver/lubuntu",
            Labels: {
                "traefik.enable": "true",
                "traefik.port": "5901",
                ["traefik.tcp.routers." + containerName + ".entrypoints"]: "vnc",
                ["traefik.tcp.routers." + containerName + ".rule"]: "HostSNI(`" + reachableAddress + "`)",
                ["traefik.tcp.routers." + containerName + ".service"]: containerName,
                ["traefik.tcp.services." + containerName + ".loadbalancer.servers"]: containerName
            },
        }
    }
}