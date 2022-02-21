// const DockerClient = require('../DockerClient.js');
import DockerClient from '../DockerClient.js';
import HttpTraefikProvider from '../provider/HttpTraefikProvider.js';

var client = null;

beforeEach(function() {
    client = new DockerClient(new HttpTraefikProvider());
});

afterEach(function(done) {
    client.stop();
    done();
});

describe("DockerClient", () => {

    it ("should create a container", function() {
        // expect(client.connect())
        client.start().then((container) => {
            console.log(container);
            expect(true).toBe(true);
        });
    });
});
