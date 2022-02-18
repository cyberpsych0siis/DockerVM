const DockerClient = require('../DockerClient.js');

var client = null;

beforeEach(function() {
    client = new DockerClient();
})

describe("DockerClient", () => {

    it ("should start a container", function() {
        expect(client.connect())
    });
});
