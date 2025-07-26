import { Router, Response } from 'express'
// @ts-expect-error - unique-string-generator doesn't have types
import { UniqueCharOTP } from 'unique-string-generator'

import { Room } from '@/models/room'
import { AuthenticatedRequest } from '@/types'
import { insertRoom } from '@/utils/redis'
import { AppError, InternalServerError } from '@/errors'

const roomsRouter = Router()

roomsRouter.get('/', async (request: AuthenticatedRequest, response: Response): Promise<void> => {
  response.json({ message: 'Hello from rooms!' })
})

roomsRouter.post('/create', async (request: AuthenticatedRequest, response: Response): Promise<void> => {
  try {
    const id: string = UniqueCharOTP(4)
    const newRoom = Room.create(id)

    await insertRoom(newRoom)
    response.status(201).json(newRoom)
  } catch (error) {
    if (error instanceof AppError) {
      response.status(error.statusCode).json({
        error: error.message,
        code: error.errorCode
      })
    } else {
      const serverError = new InternalServerError('Failed to create room')
      response.status(serverError.statusCode).json({
        error: serverError.message,
        code: serverError.errorCode
      })
    }
  }
})

export default roomsRouter
