/*window.onload = () => {
  createSocket();
}*/

function createSocket() {
  let s = new WebSocket("ws://" + location.host + "/socket");

  s.onmessage = async data => {
    console.log(data);
    let logElem = document.getElementById("log");
    logElem.innerText += await data.data.text() + "\n";
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

function connect() {
  createSocket();
}
