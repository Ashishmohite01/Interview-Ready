const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

async function authUser(req, res, next) {
    try {
        const authHeader = req.headers.authorization
        const bearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null
        const token = req.cookies.token || bearerToken || req.headers["x-access-token"]

        if (!token) {
            return res.status(401).json({
                message: "Authentication required. Token not provided."
            })
        }

        const isTokenBlacklisted = await tokenBlacklistModel.findOne({ token })
        if (isTokenBlacklisted) {
            return res.status(401).json({
                message: "Session expired or invalid. Please login again."
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decoded
        next()
    } catch (err) {
        return res.status(401).json({
            message: "Invalid or expired authentication token. Please login again."
        })
    }
}

module.exports = { authUser }
