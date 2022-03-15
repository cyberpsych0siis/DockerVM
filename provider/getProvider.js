// import HttpTraefikProvider from "../provider/HttpTraefikProvider.js";
// import VncTraefikProvider, {
//   NoVncTraefikProvider,
// } from "../provider/VncTraefikProvider.js";
// import RdpTraefikProvider from "../provider/RdpTraefikProvider.js";
// import VsCodeTraefikProvider from "../provider/VsCodeTraefikProvider.js";
import { VsCodeTraefikProvider } from "./VsCodeTraefikProvider.js";

export function getProviderById(id) {
  console.log(id);
  if (id == "") throw new Error("Invalid ID");

  // const s = msg.split(" ");
  switch (id) {
    case "vscode":
      return new VsCodeTraefikProvider();
    // case "http":
    //   return new HttpTraefikProvider();

    // case "vnc":
    //   return new VncTraefikProvider();

    // case "rdp":
    //   return new RdpTraefikProvider();

    // case "novnc":
    //   return new NoVncTraefikProvider();

    default:
      throw new Error("Unknown Provider specified");
  }
}
