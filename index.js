import logger from "morgan";
import WebSocketRoute from "./routes/WebSocketRoute.js";
import HealthcheckRoute from "./routes/HealthcheckRoute.js";
import express from "express";
import process from "process";
import APIRoute from "./api/APIRoute.js";
import enableWs from "express-ws";

import session from "express-session";
import redis from "redis";
import connectRedis from "connect-redis";

const redisStore = connectRedis(session);
const client = redis.createClient({
  host: "redis",
});

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

  app.use(
    session({
      secret: "ssshhhhh",
      genid: function (req) {
        return req.headers["x-session"];
      },
      // create new redis store.
      store: new redisStore({
        host: "localhost",
        port: 6379,
        client: client,
        ttl: 260,
      }),
      saveUninitialized: false,
      resave: false,
    })
  );

  app.use("/health", HealthcheckRoute);

  APIRoute(app);

  //our http server which handles websocket proxy and static
  const PORT = process.env.WEBSOCKET_PORT ?? 8085;
  const server = app.listen(PORT, () => {
    console.log("[WebSocket] Listening to port " + PORT);
  }); /*  */

  //WebSocketRoute(server, app);
})();
