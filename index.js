import logger from "morgan";
// import WebSocketRoute from "./routes/WebSocketRoute.js";
import HealthcheckRoute from "./routes/HealthcheckRoute.js";
import express from "express";
import process from "process";
import APIRoute from "./api/APIRoute.js";
import enableWs from "express-ws";

import session from "header-session/session.js";

(function () {
  const app = express();
  enableWs(app);

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

  app.use(session());

  app.use("/health", HealthcheckRoute);

  APIRoute(app);

  //our http server which handles websocket proxy and static
  const PORT = process.env.WEBSOCKET_PORT ?? 8085;
  const server = app.listen(PORT, () => {
    console.log("[WebSocket] Listening to port " + PORT);
  }); /*  */

  //WebSocketRoute(server, app);
})();
