import express from 'express'
import 'express-async-errors'
import cors from 'cors'

import roomsRouter from '@/controllers/rooms'
import loginRouter from '@/controllers/login'
import middleware from '@/utils/middleware'

const app = express()

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

export default app
