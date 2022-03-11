import stream from 'stream';

export default (source, destination) => {
    source.on("data", (d) => {
        console.log(d.toString());
    });
}