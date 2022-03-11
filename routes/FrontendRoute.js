import expressStatic from "express-static"

/**
 * @deprecated
 */
export default (req, res, next) => {
    return expressStatic("public");
}