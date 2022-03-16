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
// import Store from "./utils/Store.js";

import RedisStore from "./utils/pleaseJustWork.js";
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

  /*   app.use(
    session({
      secret: "ssshhhhh",
      genid: function (req) {
        // console.log(req.headers);
        return req.headers["x-session"] ?? "invalid session token";
        // return uuid();
      },
      saveUninitialized: true,
      resave: true,
      store: new Store(
        redis.createClient({
          host: "redis",
        })
      ),
    })
  ); */

  app.use(
    session({
      secret: "i am a dirty whore lol",
      saveUninitialized: true,
      resave: true,
      store: new RedisStore(
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
