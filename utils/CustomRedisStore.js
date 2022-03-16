export default class CustomRedisStore extends EventEmitter {
  constructor(redis) {
    this.redis = redis;
  }

  destroy(sid, callback) {
    callback(error);
  }

  get(sid, callback) {
    callback(error, session);
  }

  set(sid, session, callback) {
    this.redis.set();
  }

  touch(sid, session, callback) {}
}
