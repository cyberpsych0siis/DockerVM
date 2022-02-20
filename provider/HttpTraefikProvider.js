const LabelProvider = require("../LabelProvider.js");

module.exports = class HttpTraefikProvider extends LabelProvider {
    /**
     * 
     * @param {string} containerName 
     * @param {string} reachableAddress 
     * @param {string} proxyPort 
     * @returns Object
     */
    getProperties(containerName, reachableAddress, proxyPort) {
        return {
            Labels: {
                "traefik.enable": "true",
                "traefik.port": proxyPort,
                ["traefik.http.routers." + containerName + ".entrypoints"]: "web",
                ["traefik.http.routers." + containerName + ".rule"]: "Host(`" + reachableAddress + "`)"
            },
        }
    }
}