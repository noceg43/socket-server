const express = require('express')
require('express-async-errors')
const app = express()
const cors = require('cors')
const roomsRouter = require('./controllers/rooms')
const loginRouter = require('./controllers/login') // Import login router
const middleware = require('./utils/middleware')

app.use(cors())
app.use(express.json())

app.use(middleware.limiter)
app.use(middleware.requestLogger)

// Apply token extractor globally to make token available
app.use(middleware.tokenExtractor)

// Public route for getting a token
app.use('/api/login', middleware.loginMiddleware, loginRouter)

// Protected routes - require a valid token
app.use('/api/rooms', middleware.userExtractor, roomsRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app