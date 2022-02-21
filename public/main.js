/*window.onload = () => {
  createSocket();
}*/

var socket;

function createSocket() {
  let s = new WebSocket("ws://" + location.host + "/socket");

  s.onmessage = async data => {
    console.log(data);
    let logElem = document.getElementById("log");
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
    console.error(err.data);
  }

/*   setTimeout(() => {
    alert("closing");
    s.close();

    console.log(s);
  }, 5000); */

  return s;
}

/* function connect() {
  socket = createSocket();
} */

function send(cmd) {
  socket.send(cmd);
}

window.onload = () => {
  socket = createSocket();
}

function startNginx() {
  socket.send("start http");
}

function startVnc() {
  socket.send("start vnc");
}

function startRdp() {
  socket.send("start rdp");
}