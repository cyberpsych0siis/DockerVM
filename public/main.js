var socket;

function createSocket() {
  // let s = new WebSocket("ws://" + location.host + "/");
  let s = new WebSocket("ws://" + location.host + location.pathname + "/socket");

  s.onmessage = async data => {
    console.log(data);
    let logElem = document.getElementById("linkAnchor");
    let msg = "no message";
    switch (typeof await data.data) {
      case "object":
        //is blob
        msg = await data.data.text();
        break;
      case "string":
        msg = await data.data.toString(); //you can never be sure
        break;
    }
    logElem.innerText += msg + "\n";
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

(function() {
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

function startVscode() {
  send("start vscode");
}