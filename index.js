import logger from "morgan";
import WebSocketRoute from "./routes/WebSocketRoute.js";
import HealthcheckRoute from "./routes/HealthcheckRoute.js";
import express from "express";
import process from "process";
import APIRoute from "./api/APIRoute.js";
import enableWs from "express-ws";

import session from "express-session";
import redis from "ioredis";
// import connectRedis from "connect-redis";
import { uuid } from "uuidv4";
import CustomRedisStore from "./utils/CustomRedisStore.js";

/* const redisStore = connectRedis(session);
const client = redis.createClient({
  host: "redis",
}); */

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
        // console.log(req.headers);
        return req.headers["x-session"] ?? "invalid session token";
        // return uuid();
      },
      /*       // create new redis store.
      store: new redisStore({
        host: "localhost",
        port: 6379,
        client: client,
        ttl: 260,
      }), */
      saveUninitialized: false,
      resave: true,
      store: new CustomRedisStore(
        redis.createClient({
          host: "redis",
        })
      ),
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
