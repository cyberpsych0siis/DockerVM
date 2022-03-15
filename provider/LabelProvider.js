export class LabelProvider {
  private = false;

  /**
   * Should return options on how the element is connected to the proxy
   */
  getProperties(
    containerName, //The name of the container (typically the first part of a UUID)
    reachableAddress //external address thats used to connect to the client
  ) {
    return {};
  }

  setWebsocket(ws) {}

  static getProviderById(id) {
    // getProviderById(id);
  }
}
