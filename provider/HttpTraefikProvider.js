import { LabelProvider } from "./LabelProvider.js";

export class HttpTraefikProvider extends LabelProvider {
  Image = "docker.io/nginx";
  /**
   *
   * @param {string} containerName
   * @param {string} reachableAddress
   * @param {string} proxyPort
   * @returns Object
   */
  getProperties(containerName, reachableAddress) {
    return {
      Image: this.Image,
      Labels: {
        "traefik.enable": "true",
        "traefik.port": "80",
        ["traefik.http.routers." + containerName + ".entrypoints"]: "web,websecure",
        ["traefik.http.routers." + containerName + ".tls.certresolver"]: "cloudflare",
        ["traefik.http.routers." + containerName + ".rule"]:
          "Host(`" + reachableAddress + "`)",
      },
    };
  }
}
