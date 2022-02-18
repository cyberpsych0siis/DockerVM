const Docker = require("dockerode");
const docker = new Docker({
    socketPath: "/var/run/docker.sock",
    version: 'v1.25'
});


// promises are supported
var auxContainer;
docker.createContainer({
  Image: 'ubuntu',
  AttachStdin: false,
  AttachStdout: true,
  AttachStderr: true,
  Tty: true,
  Cmd: ['/bin/bash', '-c', 'tail -f /var/log/dmesg'],
  OpenStdin: false,
  StdinOnce: false
}).then(function(container) {
  auxContainer = container;
  return auxContainer.start();
})


/*.then(function(data) {
  return auxContainer.resize({
    h: process.stdout.rows,
    w: process.stdout.columns
  });
})/*.then(function(data) {
  return auxContainer.stop();
}).then(function(data) {
  return auxContainer.remove();
}).then(function(data) {
  console.log('container removed');
}).catch(function(err) {
  console.log(err);
});*/