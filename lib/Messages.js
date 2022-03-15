export default class Message {
  constructor(type, msg) {
    this.type = type;
    this.msg = msg;
  }
}

export class InstanceStartedMessage extends Message {
  constructor(url) {
    super("conn", url);
  }
}

export class WebsocketError extends Message {
  constructor(err) {
    super("err", err.message);
  }
}

export class DockerEndpointCreated extends Message {
  constructor(addr) {
    super("endp", "http://" + addr);
  }
}

export class DockerLogMessage {
  constructor(msg) {
    // console.log(msg);
    this.type = "logchunk";
    this.msg = msg;
    // super("msg", msg);
  }
}

export class DockerPullLogMessage extends Message {
  constructor(msg) {
    // this.type = "pullchunk";
    super("pullchunk", msg.status);
    // Object.assign(this, msg);
  }
}

export class ConnectionEstablishedMessage extends Message {
  constructor() {
    super("hello", "Connection established");
  }
}
