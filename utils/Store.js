import EventEmitter from "events";
import Session from "./Session.js";

export default class Store extends EventEmitter {
  options = {};

  sessionPrefix = "sess_";

  constructor(redisClient) {
    this.redisClient = redisClient;
  }

  /*   createSession(req, oldSession) {
    console.log(oldSession);
    req.session = new Session(req, oldSession);
    return req.session;
  } */

  destroy(sid, callback) {
    console.log("Destroy " + sid);
    this.redisClient.del(sid);
    callback(null);
  }

  /*   load(sid, fn) {
    var self = this;
    this.get(sid, function (err, sess) {
      if (err) return fn(err);
      if (!sess) return fn();
      var req = { sessionID: sid, sessionStore: self };
      fn(null, self.createSession(req, sess));
    });
  } */

  get(sid, callback) {
    // console.log(sid);
    this.redisClient.get(this.sessionPrefix + sid).then((result) => {
      console.log(arguments);
      callback(null, JSON.parse(result));
    });
  }

  set(sid, session, callback) {
    // this.storage.set(sid, session);
    this.redisClient.set(this.sessionPrefix + sid, JSON.stringify(session));
    // console.log(sid);
    callback(null);
    // this.redis.set();
  }

  /*   touch(sid, session, callback) {
    // console.log(sid, session);
    callback(null);
  } */
}
