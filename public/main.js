var socket;

function createSocket() {
  // let s = new WebSocket("ws://" + location.host + "/");
  let s = new WebSocket("ws://" + location.host + location.pathname + '/');

  s.onmessage = async data => {
    console.log(data);
    // let logElem = document.getElementById("log");
    let logArea = document.getElementById("logarea");

    let msg = "no message";
    switch (typeof await data.data) {
      case "object":
        //is blob

        console.log("blob");
        let d = await data.data.text()
        msg = createLogEntry(d);
        // let json = JSON.parse(d);
        break;
      case "string":
        console.log("text");
        let f = await data.data.toString(); //you can never be sure
        msg = createLogEntry(f);
        break;
    }
    // logElem.innerText += msg + "\n";
    logArea.appendChild(msg);
    logArea.scrollTo(0, logArea.scrollHeight);

  }

  s.onerror = err => {
    console.error(err);
  }

  return s;
}

function send(cmd) {
  // if (!socket) socket = createSocket();
  socket.send(cmd);
}

/* window.onload = () => {
} */

(function () {
  window.addEventListener("load", (e) => {
    socket = createSocket();
  });
})();

function startNginx() {
  send("start http");
}

function startVnc() {
  send("start vnc");
}

function startNoVnc() {
  send("start novnc");
}

function startRdp() {
  send("start rdp");
}

function createLogEntry(obj) {
  console.log(obj);
  let m = JSON.parse(obj);
  let e = document.createElement("div");
  e.classList.add("log", m.type);
  switch (m.type) {
/*     case "pullchunk":
      e.innerHTML = m.status;
      break; */
    default:
      e.innerHTML = m.msg;
      break;
  }
  return e;
}
