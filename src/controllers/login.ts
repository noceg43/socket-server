import { Router, Request, Response } from 'express'
import * as jwt from 'jsonwebtoken'
import crypto from 'crypto'

import config from '@/utils/config'
import { TokenPayload } from '@/types'
import { AppError, InternalServerError } from '@/errors'

const loginRouter = Router()

const generateRandomId = (): string => {
  return crypto.randomBytes(16).toString('hex')
}

loginRouter.post('/', async (request: Request, response: Response): Promise<void> => {
  try {
    const tokenPayload: TokenPayload = {
      id: 'device-' + generateRandomId(),
      type: 'device-token'
    }

    const token = jwt.sign(tokenPayload, config.JWT_SECRET)

    response
      .status(200)
      .send({ token })
  } catch (error) {
    if (error instanceof AppError) {
      response.status(error.statusCode).json({
        error: error.message,
        code: error.errorCode
      })
    } else {
      const serverError = new InternalServerError('Failed to generate token')
      response.status(serverError.statusCode).json({
        error: serverError.message,
        code: serverError.errorCode
      })
    }
  }
})

export default loginRouter
