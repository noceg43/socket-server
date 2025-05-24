const logger = require('./logger')
const jwt = require('jsonwebtoken')
const config = require('./config')

const rateLimit = require('express-rate-limit')

const requestLogger = (request, response, next) => {
  logger.info('Method:', request.method)
  logger.info('Path:  ', request.path)
  logger.info('Body:  ', request.body)
  logger.info('---')
  next()
}

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many requests from this device',
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, request, response, next) => {
  logger.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

const tokenExtractor = (request, response, next) => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    request.token = authorization.substring(7)
  } else {
    request.token = null
  }
  next()
}

// Common authentication logic
const authenticateUser = (token) => {
  if (!token) {
    return { error: 'token missing', status: 401 }
  }

  try {
    const decodedToken = jwt.verify(token, config.JWT_SECRET)
    if (!decodedToken.id) {
      return { error: 'token invalid', status: 401 }
    }
    return { user: decodedToken }
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return { error: 'invalid token', status: 401 }
    } else if (error.name === 'TokenExpiredError') {
      return { error: 'token expired', status: 401 }
    }
    // Handle other potential errors
    return { error: 'token verification failed', status: 500 }
  }
}

// REST API user extractor middleware
const userExtractor = (request, response, next) => {
  const result = authenticateUser(request.token)
  
  if (result.error) {
    return response.status(result.status).json({ error: result.error })
  }
  
  request.user = result.user
  next()
}

// WebSocket user extractor middleware
const socketUserExtractor = (socket, next) => {
  // Extract token from socket handshake auth or headers (since postman sends it in headers)
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization
  
  const tokenMatch = token && token.toLowerCase().startsWith('bearer ')
  const extractedToken = tokenMatch ? token.substring(7) : null
  const result = authenticateUser(extractedToken) 
  
  if (result.error) {
    const error = new Error(result.error)
    error.data = { status: result.status }
    return next(error)
  }
  
  socket.user = result.user
  next()
}

module.exports = {
  requestLogger,
  limiter,
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
  userExtractor,
  socketUserExtractor,
  authenticateUser
}