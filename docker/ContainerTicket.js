
  let ContainerTicket = (container) => {
  /*return {
      id: newUuid,  //container name
      reachableHostname: reachableHostname, //name + .subdomain
      socket: socketAddress,  //
      channels: channels,
    };*/

  // const info = await asyncStuff(container);

  console.log("container");
  // console.log((container));
  // console.log(info);

  return "container";

  // return {
      // id: container.
    // }
}

function asyncStuff(container) {
  return new Promise((res, rej) => {
    container.inspect(function (err, data) {
      if (err) rej(err);

      console.log(data);
      res(data);
    });
  })
}
    // export default ContainerTicket;