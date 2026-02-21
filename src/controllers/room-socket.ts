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

const initWebSockets = async (server: HttpServer): Promise<SocketIOServer> => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: ['https://admin.socket.io'],
      credentials: true
    }
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

    socket.on('join-room', (roomId: unknown) => {
      try {
        const validatedRoomId = SocketJoinRoomSchema.parse(roomId)
        onJoinRoom(io, socket, validatedRoomId)
      } catch (error) {
        console.error(`Invalid join-room data from ${socket.id}:`, error)
        socket.emit('error', { message: 'Invalid room ID format' })
      }
    })

    socket.on('leave-room', (roomId: unknown) => {
      try {
        const validatedRoomId = SocketLeaveRoomSchema.parse(roomId)
        onLeaveRoom(io, socket, validatedRoomId)
      } catch (error) {
        console.error(`Invalid leave-room data from ${socket.id}:`, error)
        socket.emit('error', { message: 'Invalid room ID format' })
      }
    })

    socket.on('disconnect', (reason: string) => {
      console.log(`User disconnected: ${socket.id} (${socket.user?.id}), reason: ${reason}`)
    })
  })

  return io
}

const broadcastState = (io: SocketIOServer, roomId: string, room: Room) => {
  io.sockets.in(roomId).emit('room-state', {
    id: room.id,
    state: room.gameState
  })
}

/**
 * Helper to handle game logic events consistently
 */
const handleGameEvent = async (
  io: SocketIOServer,
  socket: SocketWithUser,
  roomId: string,
  event: GameInputEvent
): Promise<void> => {
  try {
    const room = await redis.getRoom(roomId)
    if (!room) return

    // Inject transition broadcast logic
    const originalTransitionTo = room.gameState.transitionTo.bind(room.gameState)
    room.gameState.transitionTo = (newState: any) => {
      originalTransitionTo(newState)
      // Broadcast whenever a transition happens
      broadcastState(io, roomId, room)
    }

    room.gameState.processEvent(event)
    broadcastState(io, roomId, room)
  } catch (err) {
    console.error(`Error processing game event ${event.type}:`, err)
  }
}

const onLeaveRoom = async (io: SocketIOServer, socket: SocketWithUser, roomId: string): Promise<void> => {
  try {
    if (socket.user) {
      const room = await redis.leaveRoom(roomId, socket.user)
      socket.leave(roomId)
      broadcastState(io, roomId, room)
      console.log(`User ${socket.id} (${socket.user.id}) left room: ${roomId}`)
    }
  } catch (err) {
    console.error(`Leave room error for ${socket.id}:`, err)
  }
}

const onJoinRoom = async (io: SocketIOServer, socket: SocketWithUser, roomId: string): Promise<void> => {
  try {
    if (!socket.user) {
      console.error('Socket user not found')
      return
    }

    const room = await redis.joinRoom(roomId, socket.user)
    socket.join(roomId)

    console.log(`User ${socket.id} joined room: ${roomId}`)

    // Broadcast state immediately after joining
    broadcastState(io, roomId, room)

    // Register individual event listeners as requested
    socket.on('ready', (isReady: boolean) => {
      handleGameEvent(io, socket, roomId, { type: 'ready', payload: { id: socket.user!.id, isReady } })
    })

    socket.on('add', (text: string) => {
      handleGameEvent(io, socket, roomId, { type: 'add', payload: { id: socket.user!.id, text } })
    })

    socket.on('change-settings', (settings: { rounds?: number; timer?: number }) => {
      handleGameEvent(io, socket, roomId, { type: 'change-settings', payload: settings })
    })

    // Handle disconnect by leaving room
    socket.on('disconnect', () => {
      onLeaveRoom(io, socket, roomId)
    })
  } catch (err) {
    console.error(`Join room error for ${socket.id}:`, err)
  }
}

export default initWebSockets
