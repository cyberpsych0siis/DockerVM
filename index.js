
import logger from 'morgan';
import { parse } from 'url';

import WebSocketRoute, { callbackRoute, serveBootstrapRoute } from './routes/WebSocketRoute.js';
import HealthcheckRoute from './routes/HealthcheckRoute.js';

import express from 'express';
import expressStatic from 'express-static';
import process from 'process';


import axios from 'axios';
import FrontendRoute from './routes/FrontendRoute.js';

(function () {
    const app = express();
    app.use(logger('dev', {
        skip: function (req, res) {
            // console.log(req.url);
            if (req.url == '/health' || req.url == '/') {
                return true;
            } else {
                return false;
            }
        }
    }));

    app.use("/health", HealthcheckRoute);

    app.get("/bootstrap", serveBootstrapRoute);

    app.post("/cb", express.urlencoded(), callbackRoute);

    //our http server which handles websocket proxy and static
    const PORT = process.env.WEBSOCKET_PORT ?? 8085;
    const server = app.listen(PORT, () => { console.log("[WebSocket] Listening to port " + PORT) });/*  */

    WebSocketRoute(server, app);

    app.use(expressStatic('public'));
})();
