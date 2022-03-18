// import DockerClient from "../../DockerClient.js";
import { LabelProvider } from "../../provider/LabelProvider.js";
// import { getProviderByMessage } from "../../lib/Utils.js";
import { getProviderById } from "../../provider/getProvider.js";
import websocketStream from "websocket-stream";
import {
  DockerLogMessage,
  WebsocketError,
  DockerPullLogMessage,
  DockerEndpointCreated,
} from "../../lib/Messages.js";

export default (websocket, data) => {
  let dClient;
  try {
    const provider = getProviderById(data.toString());
    dClient = new DockerClient({
      provider: provider,
    });

    // console.log(dClient);

    dClient
      .pullImage(websocketStream(websocket), DockerPullLogMessage)
      .then(() => {
        dClient
          .start()
          .then((data) => {
            // console.log(data);
            websocket.send(
              JSON.stringify(new DockerEndpointCreated(data.endpoint))
            );
            data.logStream.on("data", (d) => {
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
