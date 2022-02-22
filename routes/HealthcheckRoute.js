export default (req, res, next) => {
    res.send(JSON.stringify({
        healthy: true
    }));
}