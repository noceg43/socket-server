import { Server as HttpServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { instrument } from '@socket.io/admin-ui'

import { redisClient } from '@/utils/redis'
import middleware from '@/utils/middleware'
import * as redis from '@/utils/redis'
import { SocketWithUser, SocketJoinRoomSchema, SocketLeaveRoomSchema } from '@/types'
import { GameInputEvent } from 'wth_logic'
import { Room } from '@/models/room'

// Kept logs from previous implementations as requested

interface ServerOptions {
  cors: {
    origin: string[];
    credentials: boolean;
  };
}

type SocketGameEvent = Omit<GameInputEvent, 'payload'> & {
  payload?: unknown
}

const initWebSockets = async (server: HttpServer): Promise<SocketIOServer> => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: ['https://admin.socket.io'],
      credentials: true
    },
    pingInterval: 3000,
    pingTimeout: 3000,
  } as ServerOptions)

  io.use(middleware.socketUserExtractor)

  instrument(io, {
    auth: false,
    mode: 'development',
    namespaceName: '/admin',
    readonly: false
  })

  const subClient = redisClient.duplicate()
  if (!redisClient.isOpen) {
    await redisClient.connect()
  }
  await subClient.connect()

  io.adapter(createAdapter(redisClient, subClient))

  redisClient.on('error', (err: Error) => {
    console.error(err.message)
  })

  subClient.on('error', (err: Error) => {
    console.error(err.message)
  })

  io.on('connection', (socket: SocketWithUser) => {
    console.log(`User connected: ${socket.id}, User ID: ${socket.user?.id}`)
    let activeRoomId: string | null = null

    socket.on('join-room', async (roomId: unknown) => {
      try {
        const validatedRoomId = SocketJoinRoomSchema.parse(roomId)
        const joinedRoom = await onJoinRoom(io, socket, validatedRoomId)
        if (joinedRoom) {
          activeRoomId = validatedRoomId
        }
      } catch (error) {
        console.error(`Invalid join-room data from ${socket.id}:`, error)
        socket.emit('error', { message: 'Invalid room ID format' })
      }
    })

    socket.on('leave-room', async (roomId: unknown) => {
      try {
        const validatedRoomId = SocketLeaveRoomSchema.parse(roomId)
        const leftRoom = await onLeaveRoom(io, socket, validatedRoomId)
        if (leftRoom && activeRoomId === validatedRoomId) {
          activeRoomId = null
        }
      } catch (error) {
        console.error(`Invalid leave-room data from ${socket.id}:`, error)
        socket.emit('error', { message: 'Invalid room ID format' })
      }
    })

    socket.on('game-event', (event: SocketGameEvent) => {
      if (!activeRoomId) {
        return
      }

      void handleGameEvent(io, socket, activeRoomId, event)
    })

    socket.on('disconnect', async (reason: string) => {
      if (activeRoomId) {
        await onLeaveRoom(io, socket, activeRoomId)
        activeRoomId = null
      }
      console.log(`User disconnected: ${socket.id} (${socket.user?.id}), reason: ${reason}`)
    })
  })

  return io
}

const broadcastState = (io: SocketIOServer, roomId: string, room: Room) => {
  io.sockets.in(roomId).emit('room-state', {
    id: room.id,
    state: room.toJSON().state
  })
}

const syncRoom = async (io: SocketIOServer, roomId: string, room: Room): Promise<void> => {
  await redis.saveRoom(room)
  broadcastState(io, roomId, room)
}

/**
 * Helper to handle game logic events consistently
 */
const handleGameEvent = async (
  io: SocketIOServer,
  socket: SocketWithUser,
  roomId: string,
  event: SocketGameEvent
): Promise<void> => {
  try {
    const room = await redis.getRoom(roomId)
    if (!room) return

    if (!socket.user) {
      return
    }

    const securePayload = {
      ...(event.payload && typeof event.payload === 'object' ? event.payload : {}),
      id: socket.user.id
    }

    const secureEvent = {
      type: event.type,
      payload: securePayload
    } as GameInputEvent

    room.gameState.processEvent(secureEvent)

    await syncRoom(io, roomId, room)
  } catch (err) {
    console.error(`Error processing game event ${event.type} from user ${socket.user?.id}:`, err)
  }
}

const onLeaveRoom = async (io: SocketIOServer, socket: SocketWithUser, roomId: string): Promise<Room | null> => {
  try {
    if (socket.user) {
      const room = await redis.leaveRoom(roomId, socket.user)
      socket.leave(roomId)
      await syncRoom(io, roomId, room)
      console.log(`User ${socket.id} (${socket.user.id}) left room: ${roomId}`)
      return room
    }
  } catch (err) {
    console.error(`Leave room error for ${socket.id}:`, err)
  }

  return null
}

const onJoinRoom = async (io: SocketIOServer, socket: SocketWithUser, roomId: string): Promise<Room | null> => {
  try {
    if (!socket.user) {
      console.error('Socket user not found')
      return null
    }

    const room = await redis.joinRoom(roomId, socket.user)
    socket.join(roomId)

    console.log(`User ${socket.id} joined room: ${roomId}`)

    broadcastState(io, roomId, room)
    return room
  } catch (err) {
    console.error(`Join room error for ${socket.id}:`, err)
    return null
  }
}

export default initWebSockets
