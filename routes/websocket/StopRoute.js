export default (websocket, containerId) => {
  dClient = new DockerClient({
    containerId: containerId,
  });

  // console.log()
  console.error("[WebSocket] closing because of " + err);

  let auxContainer;

  // if (dClient.docker != null) {
    dClient
      .stop()
      .then((container) => {
        auxContainer = container;
        // closed = true;
        // stream.end();
      })
      .catch((err) => {
        // websocket.send("[WebSocket] connection closed");
        console.error(err);
      })
      .finally(() => {
        //cleanup
        // if (dClient.docker) {
        dClient.remove();
        // }
      });
  }
};
