/*window.onload = () => {
  createSocket();
}*/

function createSocket() {
  let s = new WebSocket("ws://" + location.host + "/socket");

  s.onmessage = data => {
    console.log(data);
    let logElem = document.getElementById("log");
    logElem.innerText += data.data + "\n";
  }
}

function connect() {
  createSocket();
}
