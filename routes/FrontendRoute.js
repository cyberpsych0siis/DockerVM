import expressStatic from "express-static"

export default (req, res, next) => {
    return expressStatic("public");
}