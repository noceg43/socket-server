import { Server as HttpServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { instrument } from '@socket.io/admin-ui'

import { redisClient } from '@/utils/redis'
import middleware from '@/utils/middleware'
import * as redis from '@/utils/redis'
import { SocketWithUser, SocketJoinRoomSchema, SocketLeaveRoomSchema } from '@/types'

interface ServerOptions {
  cors: {
    origin: string[];
    credentials: boolean;
  };
}

const initWebSockets = async (server: HttpServer): Promise<SocketIOServer> => {
  // Initialize Socket.io with CORS configuration
  const io = new SocketIOServer(server, {
    cors: {
      origin: ['https://admin.socket.io'],
      credentials: true
    }
  } as ServerOptions)

  io.use(middleware.socketUserExtractor)

  // Setup admin UI with anonymous auth
  instrument(io, {
    auth: false,
    mode: 'development',
    namespaceName: '/admin',
    readonly: false
  })

  // Replace in-memory adapter with Redis
  const subClient = redisClient.duplicate()
  if (!redisClient.isOpen) {
    await redisClient.connect()
  }
  await subClient.connect()

  io.adapter(createAdapter(redisClient, subClient))

  // Log admin UI access information
  console.log('Socket.IO Admin UI is available at: https://admin.socket.io')
  console.log('Server URL to connect: http://localhost:' + (process.env.PORT || 3001))
  console.log('Auth: Disabled (anonymous access)')

  // Add error handlers
  redisClient.on('error', (err: Error) => {
    console.error(err.message)
  })

  subClient.on('error', (err: Error) => {
    console.error(err.message)
  })

  // Listen for new connection
  io.on('connection', (socket: SocketWithUser) => {
    console.log(`User connected: ${socket.id}, User ID: ${socket.user?.id}`)

    // Add listener for joining rooms
    socket.on('join-room', (roomId: unknown) => {
      try {
        const validatedRoomId = SocketJoinRoomSchema.parse(roomId)
        onJoinRoom(io, socket, validatedRoomId)
      } catch (error) {
        console.error(`Invalid join-room data from ${socket.id}:`, error)
        socket.emit('error', { message: 'Invalid room ID format' })
      }
    })

    // Add listener for leaving rooms
    socket.on('leave-room', (roomId: unknown) => {
      try {
        const validatedRoomId = SocketLeaveRoomSchema.parse(roomId)
        onLeaveRoom(io, socket, validatedRoomId)
      } catch (error) {
        console.error(`Invalid leave-room data from ${socket.id}:`, error)
        socket.emit('error', { message: 'Invalid room ID format' })
      }
    })

    // Logs
    io.of('/').adapter.on('create-room', (room: string) => {
      console.log(`room ${room} was created`)
    })

    io.of('/').adapter.on('join-room', (room: string, id: string) => {
      console.log(`socket ${id} has joined room ${room}`)
    })

    // Add listener for disconnection
    socket.on('disconnect', (reason: string) => {
      console.log(`User disconnected: ${socket.id} (${socket.user?.id}), reason: ${reason}`)
    })
  })

  return io
}

const onLeaveRoom = async (io: SocketIOServer, socket: SocketWithUser, roomId: string): Promise<void> => {
  try {
    socket.leave(roomId)
    if (socket.user) {
      const room = await redis.leaveRoom(roomId, socket.user)
      io.sockets.in(roomId).emit('event', room)
      console.log(`User ${socket.id} (${socket.user.id}) left room: ${roomId}`)
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Leave room error for ${socket.id}:`, errorMessage)
  }
}

const onJoinRoom = async (io: SocketIOServer, socket: SocketWithUser, roomId: string): Promise<void> => {
  try {
    const room = await redis.getRoom(roomId)
    if (!room) {
      console.error(`Room ${roomId} not found`)
      return
    }

    if (!socket.user) {
      console.error('Socket user not found')
      return
    }

    const updatedRoom = await redis.joinRoom(roomId, socket.user)
    socket.join(roomId)

    console.log(`User ${socket.id} joined room: ${roomId}`)
    // use io.sockets in order to notify the socket inside the room
    io.sockets.in(roomId).emit('event', updatedRoom)

    // Send event to room
    socket.on('event', (roomId: string, event: Record<string, unknown>) => {
      console.log(`Event received in room ${roomId}:`, event)
      io.sockets.in(roomId).emit('event', event)
    })

    // Clear the interval when the socket disconnects
    socket.on('disconnect', () => {
      onLeaveRoom(io, socket, roomId)
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Join room error for ${socket.id}:`, errorMessage)
  }
}

export default initWebSockets
