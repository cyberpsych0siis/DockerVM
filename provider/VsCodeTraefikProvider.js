import { LabelProvider } from "./LabelProvider.js";
export class VsCodeTraefikProvider extends LabelProvider {
  private = true;
  Image = "thallosaurus.de/cyberpsych0siis/code-server";
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
      Image: this.Image,
      //Cmd: ["/opt/code-server", "--port", "8080"],
      Labels: {
        "traefik.enable": "true",
        "traefik.port": "8080",
        ["traefik.http.routers." + containerName + ".middlewares"]:
          "auth_then_strip@file,errorcats@docker",
        ["traefik.http.routers." + containerName + ".entrypoints"]: "web",
        ["traefik.http.routers." + containerName + ".rule"]:
          "Host(`" + reachableAddress + "`) || Path(`/" + uuid + "`)",
      },
    };
  }
}
