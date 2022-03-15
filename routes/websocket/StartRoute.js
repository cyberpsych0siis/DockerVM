import DockerClient from "../../DockerClient.js";
import { LabelProvider } from "../../provider/LabelProvider.js";
// import { getProviderByMessage } from "../../lib/Utils.js";
import { getProviderById } from "../../provider/getProvider.js";
import websocketStream from "websocket-stream";
import {
  DockerLogMessage,
  WebsocketError,
  DockerPullLogMessage,
} from "../../lib/Messages.js";

export default (websocket, data) => {
  let dClient;
  try {
    const provider = getProviderById(data.toString());
    dClient = new DockerClient(provider);

    dClient
      .pullImage(websocketStream(websocket), DockerPullLogMessage)
      .then(() => {
        dClient
          .start()
          .then((logStream) => {
            logStream.on("data", (d) => {
              websocket.send(
                JSON.stringify(new DockerLogMessage(d.toString()))
              );
            });
          })
          .catch((err) => {
            dClient.stop();
            dClient.remove();
            console.error(err);
            websocket.send(JSON.stringify(new WebsocketError(err)));
          });
      })
      .catch((err) => {
        websocket.send(JSON.stringify(new WebsocketError(err)));
        console.error(err);
      });
  } catch (e) {
    websocket.send(JSON.stringify(new WebsocketError(e)));
  }

  return dClient;
};
