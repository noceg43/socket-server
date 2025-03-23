const express = require('express')
require('express-async-errors')
const app = express()
const cors = require('cors')
const roomsRouter = require('./controllers/rooms')
const middleware = require('./utils/middleware')

app.use(cors())
app.use(express.json())

app.use(middleware.limiter)

app.use('/api/rooms', roomsRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app