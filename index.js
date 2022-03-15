import logger from "morgan";
import WebSocketRoute from "./routes/WebSocketRoute.js";
import HealthcheckRoute from "./routes/HealthcheckRoute.js";
import express from "express";
import process from "process";

(function () {
  const app = express();
  app.use(
    logger("dev", {
      skip: function (req, res) {
        if (req.url == "/health" || req.url == "/") {
          return true;
        } else {
          return false;
        }
      },
    })
  );

  app.use("/health", HealthcheckRoute);

  app.get("/", (req, res) => {
    res.send("Digga ich fress nen Besen wenn das jetzt angezeigt wird");
  });

  //our http server which handles websocket proxy and static
  const PORT = process.env.WEBSOCKET_PORT ?? 8085;
  const server = app.listen(PORT, () => {
    console.log("[WebSocket] Listening to port " + PORT);
  }); /*  */

  WebSocketRoute(server, app);
})();
