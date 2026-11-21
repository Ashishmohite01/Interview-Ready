const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

/**
 * @name registerUserController
 * @description register a new user, expects username, email and password in the request body
 * @access Public
 */
async function registerUserController(req, res) {
    try {
        const { username, email, password } = req.body

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Please provide username, email and password."
            })
        }

        const isUserAlreadyExists = await userModel.findOne({
            $or: [ { username: username.trim() }, { email: email.trim().toLowerCase() } ]
        })

        if (isUserAlreadyExists) {
            return res.status(400).json({
                message: "An account already exists with this email address or username."
            })
        }

        const hash = await bcrypt.hash(password, 10)

        const user = await userModel.create({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password: hash
        })

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        )

        const isProduction = process.env.NODE_ENV === "production"
        const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        }

        res.cookie("token", token, cookieOptions)

        return res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (err) {
        console.error("Register error:", err)
        return res.status(500).json({
            message: err.message || "Failed to register user."
        })
    }
}

/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access Public
 */
async function loginUserController(req, res) {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                message: "Please provide email and password."
            })
        }

        const user = await userModel.findOne({ email: email.trim().toLowerCase() })

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password."
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Invalid email or password."
            })
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        )

        const isProduction = process.env.NODE_ENV === "production"
        const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        }

        res.cookie("token", token, cookieOptions)

        return res.status(200).json({
            message: "User logged in successfully.",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (err) {
        console.error("Login error:", err)
        return res.status(500).json({
            message: err.message || "Failed to login."
        })
    }
}

/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */
async function logoutUserController(req, res) {
    try {
        const authHeader = req.headers.authorization
        const bearerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null
        const token = req.cookies.token || bearerToken

        if (token) {
            await tokenBlacklistModel.create({ token })
        }

        const isProduction = process.env.NODE_ENV === "production"
        res.clearCookie("token", {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax"
        })

        return res.status(200).json({
            message: "User logged out successfully"
        })
    } catch (err) {
        console.error("Logout error:", err)
        return res.status(500).json({
            message: "Failed to logout properly."
        })
    }
}

/**
 * @name getMeController
 * @description get the current logged in user details.
 * @access private
 */
async function getMeController(req, res) {
    try {
        const user = await userModel.findById(req.user.id)

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            })
        }

        return res.status(200).json({
            message: "User details fetched successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (err) {
        console.error("GetMe error:", err)
        return res.status(500).json({
            message: "Failed to fetch user details."
        })
    }
}

module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController
}
