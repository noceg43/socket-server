import { Request, Response, NextFunction } from 'express'
import { Socket } from 'socket.io'
import * as jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'

import logger from './logger'
import config from './config'
import auth from './auth'
import { User } from '@/models/user'
import { AuthenticatedRequest, AuthenticationResult, TokenPayloadSchema, SocketWithUser } from '@/types'

export const requestLogger = (request: Request, response: Response, next: NextFunction): void => {
  logger.info('Method:', request.method)
  logger.info('Path:  ', request.path)
  logger.info('Body:  ', request.body)
  logger.info('---')
  next()
}

export const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many requests from this device',
})

export const unknownEndpoint = (request: Request, response: Response): void => {
  response.status(404).send({ error: 'unknown endpoint' })
}

export const errorHandler = (error: Error, request: Request, response: Response, next: NextFunction): void => {
  logger.error(error.message)

  if (error.name === 'CastError') {
    response.status(400).send({ error: 'malformatted id' })
    return
  } else if (error.name === 'ValidationError') {
    response.status(400).json({ error: error.message })
    return
  }

  next(error)
}

export function loginMiddleware(req: Request, res: Response, next: NextFunction): void {
  const signature = req.headers['x-signature'] as string
  const timestamp = req.headers['x-timestamp'] as string

  if (!signature || !timestamp) {
    res.status(400).json({ error: 'Missing signature or timestamp' })
    return
  }

  try {
    const isSigned = auth.checkLoginSignature(signature, timestamp)
    if (!isSigned) {
      res.status(401).json({ error: 'Invalid signature' })
      return
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(400).json({ error: errorMessage })
    return
  }

  next() // HMAC is valid
}

export const tokenExtractor = (request: AuthenticatedRequest, response: Response, next: NextFunction): void => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    request.token = authorization.substring(7)
  } else {
    request.token = undefined
  }
  next()
}

// Common authentication logic
export const authenticateUser = (token: string | null | undefined): AuthenticationResult => {
  if (!token) {
    return { error: 'token missing', status: 401 }
  }

  try {
    const decodedToken = jwt.verify(token, config.JWT_SECRET) as Record<string, unknown>

    // Validate token payload with Zod
    const validatedToken = TokenPayloadSchema.parse(decodedToken)

    if (!validatedToken.id) {
      return { error: 'token invalid', status: 401 }
    }

    return { user: validatedToken }
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return { error: 'invalid token', status: 401 }
    } else if (error instanceof jwt.TokenExpiredError) {
      return { error: 'token expired', status: 401 }
    }
    // Handle other potential errors including Zod validation errors
    return { error: 'token verification failed', status: 500 }
  }
}

// REST API user extractor middleware
export const userExtractor = (request: AuthenticatedRequest, response: Response, next: NextFunction): void => {
  const result = authenticateUser(request.token)

  if (result.error) {
    response.status(result.status || 500).json({ error: result.error })
    return
  }

  request.user = result.user
  next()
}

// WebSocket user extractor middleware
export const socketUserExtractor = (socket: Socket, next: (err?: Error) => void): void => {
  // Extract token from socket handshake auth or headers (since postman sends it in headers)
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization
  const userName = socket.handshake.auth?.name

  const result = authenticateUser(token)

  if (result.error) {
    const error = new Error(result.error) as Error & { data?: Record<string, unknown> }
    error.data = { status: result.status }
    next(error)
    return
  }

  if (result.user) {
    // Attach user to socket
    (socket as SocketWithUser).user = new User(result.user.id, userName || 'Anonymous')
  }

  next()
}

export default {
  requestLogger,
  limiter,
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
  userExtractor,
  socketUserExtractor,
  authenticateUser,
  loginMiddleware
}
