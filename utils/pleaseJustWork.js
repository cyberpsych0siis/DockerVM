import EventEmitter from "events";

export default class CustomRedisStore extends EventEmitter {
  options = {};

  sessionPrefix = "sess_";

  constructor(redisClient, options = {}) {
    // for (let i = 0; i < Object.keys(options); i++) {}
    // this.redis = redis;
    super();
    this.storage = new Map();
    this.redisClient = redisClient;
  }

  destroy(sid, callback) {
    console.log("Destroy " + sid);
    this.redisClient.del(sid);
    callback(null);
  }

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

  //TODO Implement TTL Touch
  /*   touch(sid, session, callback) {
    // console.log(sid, session);
    callback(null);
  } */
}
