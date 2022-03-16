import Session from "./Store.js;
// import EventEmitter from "events";

/**
 * @deprecated
 */
export default class Session {
  regenerate(req, callback) {
    this.destroy(req.sessionID, (err) => {
      this.generate(req);
      callback(err);
    });
  }

  destroy(callback) {
    delete this.req.session;
    this.req.sessionStore.destroy(this.id, fn);
    return this;
  }

  reload(callback) {
    // defineMethod(Session.prototype, 'reload', function reload(fn) {
  var req = this.req
  var store = this.req.sessionStore

  store.get(this.id, function(err, sess){
    if (err) return callback(err);
    if (!sess) return callback(new Error('failed to load session'));
    store.createSession(req, sess);
    callback();
  });
  return this;
// });
  }

  save(callback) {
    this.req.sessionStore.set(this.id, this, callback || function(){});
    return this;
  }

  load(sid, callback) {
    // var self = this;
    this.get(sid, (err, sess) => {
      if (err) return callback(err);
      if (!sess) return callback();
      var req = { sessionID: sid, sessionStore: this };
      callback(null, this.createSession(req, sess));
    });
  }

  createSession(req, sess) {
    // var expires = sess.cookie.expires;
    // var originalMaxAge = sess.cookie.originalMaxAge;

    // sess.cookie = new Cookie(sess.cookie);

    // if (typeof expires === "string") {
    // convert expires to a Date object
    // sess.cookie.expires = new Date(expires);
    // }

    // keep originalMaxAge intact
    // sess.cookie.originalMaxAge = originalMaxAge;

    req.session = new Store(req, sess);
    return req.session;
  }
  // generate(req) {}
}

/**
 * Re-generate the given requests's session.
 *
 * @param {IncomingRequest} req
 * @return {Function} fn
 * @api public
 */

Store.prototype.regenerate = function (req, fn) {
  var self = this;
  this.destroy(req.sessionID, function (err) {
    self.generate(req);
    fn(err);
  });
};

/**
 * Load a `Session` instance via the given `sid`
 * and invoke the callback `fn(err, sess)`.
 *
 * @param {String} sid
 * @param {Function} fn
 * @api public
 */



/**
 * Create session from JSON `sess` data.
 *
 * @param {IncomingRequest} req
 * @param {Object} sess
 * @return {Session}
 * @api private
 */

Store.prototype.createSession = function (req, sess) {
  var expires = sess.cookie.expires;
  var originalMaxAge = sess.cookie.originalMaxAge;

  sess.cookie = new Cookie(sess.cookie);

  if (typeof expires === "string") {
    // convert expires to a Date object
    sess.cookie.expires = new Date(expires);
  }

  // keep originalMaxAge intact
  sess.cookie.originalMaxAge = originalMaxAge;

  req.session = new Session(req, sess);
  return req.session;
};
