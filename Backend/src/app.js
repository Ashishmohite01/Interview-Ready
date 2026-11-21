const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

app.use(express.json({ limit: "15mb" }))
app.use(express.urlencoded({ extended: true, limit: "15mb" }))
app.use(cookieParser())

// Robust allowed origins list with trailing slashes trimmed
const configuredOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map(url => url.trim().replace(/\/+$/, ""))
    .filter(Boolean)

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    ...configuredOrigins
]

app.use(cors({
    origin: (origin, callback) => {
        // Allow server-to-server, curl, mobile, or requests without Origin header
        if (!origin) return callback(null, true)

        const normalizedOrigin = origin.replace(/\/+$/, "")

        // Match listed origins
        if (allowedOrigins.includes(normalizedOrigin)) {
            return callback(null, true)
        }

        // Allow any *.vercel.app deployment URL
        if (/\.vercel\.app$/.test(normalizedOrigin)) {
            return callback(null, true)
        }

        // Allow localhost on any port in development
        if (process.env.NODE_ENV !== "production" && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin)) {
            return callback(null, true)
        }

        // Disallow cleanly without throwing an unhandled exception
        return callback(null, false)
    },
    credentials: true,
    methods: [ "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS" ],
    allowedHeaders: [ "Content-Type", "Authorization", "X-Requested-With", "Accept" ]
}))

// Health check endpoints for cloud platforms (Render, Railway, AWS, etc.)
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
})

app.get("/", (req, res) => {
    res.status(200).json({
        status: "ok",
        message: "Interview Ready API is running successfully",
        environment: process.env.NODE_ENV || "development"
    })
})

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")

/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)

// 404 handler for API routes
app.use((req, res, next) => {
    res.status(404).json({
        message: `Route not found: ${req.method} ${req.originalUrl}`
    })
})

// Central error-handling middleware (prevents default HTML 500 error pages)
app.use((err, req, res, next) => {
    console.error("Unhandled API error:", err)
    const statusCode = err.status || err.statusCode || 500
    res.status(statusCode).json({
        message: err.message || "An unexpected internal server error occurred."
    })
})

module.exports = app
