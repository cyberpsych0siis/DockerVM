const LabelProvider = require("../LabelProvider.js");

module.exports = class TcpTraefikProvider extends LabelProvider {
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
            Labels: {
                "traefik.enable": "true",
                "traefik.port": "80",
                ["traefik.http.routers." + containerName + ".entrypoints"]: "web",
                ["traefik.http.routers." + containerName + ".rule"]: "Host(`" + reachableAddress + "`)"
            },
        }
    }
}