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

interface ServerOptions {
  cors: {
    origin: string[];
    credentials: boolean;
  };
}

let io: SocketIOServer
const roomCache = new Map<string, Room>()

const broadcastState = (roomId: string, room: Room) => {
  if (io) {
    io.sockets.in(roomId).emit('room-state', room.toJSON())
  }
}

const getRoomInstance = async (roomId: string): Promise<Room | null> => {
  if (roomCache.has(roomId)) {
    return roomCache.get(roomId)!
  }
  const room = await redis.getRoom(roomId)
  if (room) {
    room.onStateChange = async (r) => {
      await redis.saveRoom(r)
      broadcastState(roomId, r)
      console.log(`[LOGIC] Room ${roomId} state auto-persisted and broadcasted`)
    }
    roomCache.set(roomId, room)
  }
  return room
}

const initWebSockets = async (server: HttpServer): Promise<SocketIOServer> => {
  io = new SocketIOServer(server, {
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
    console.error(`[REDIS] Client Error: ${err.message}`)
  })

  subClient.on('error', (err: Error) => {
    console.error(`[REDIS] SubClient Error: ${err.message}`)
  })

  io.on('connection', (socket: SocketWithUser) => {
    console.log(`[SOCKET] Connected: ${socket.id}, User: ${socket.user?.id}`)

    socket.on('join-room', (roomId: unknown) => {
      try {
        const validatedRoomId = SocketJoinRoomSchema.parse(roomId)
        onJoinRoom(socket, validatedRoomId)
      } catch (error) {
        console.error(`[SOCKET] Invalid join-room data from ${socket.id}:`, error)
        socket.emit('error', { message: 'Invalid room ID format' })
      }
    })

    socket.on('leave-room', (roomId: unknown) => {
      try {
        const validatedRoomId = SocketLeaveRoomSchema.parse(roomId)
        onLeaveRoom(socket, validatedRoomId)
      } catch (error) {
        console.error(`[SOCKET] Invalid leave-room data from ${socket.id}:`, error)
        socket.emit('error', { message: 'Invalid room ID format' })
      }
    })

    socket.on('disconnect', (reason: string) => {
      console.log(`[SOCKET] Disconnected: ${socket.id} (${socket.user?.id}), Reason: ${reason}`)
    })
  })

  return io
}

/**
 * Helper to handle game logic events consistently
 */
const handleGameEvent = async (
  socket: SocketWithUser,
  roomId: string,
  event: GameInputEvent
): Promise<void> => {
  try {
    const room = await getRoomInstance(roomId)
    if (!room) {
      console.error(`[SOCKET] Room ${roomId} not found for event ${event.type}`)
      return
    }

    room.logicRoom.processEvent(event)

    // Persist once after event processing
    await redis.saveRoom(room)
    broadcastState(roomId, room)

  } catch (err) {
    console.error(`[SOCKET] Error processing game event ${event.type}:`, err)
  }
}

const onLeaveRoom = async (socket: SocketWithUser, roomId: string): Promise<void> => {
  try {
    if (socket.user) {
      const room = await getRoomInstance(roomId)
      if (!room) return

      // Instead of using redis.leaveRoom (which creates a new instance),
      // we modify our cached instance and save it.
      if (room.isUserInRoom(socket.user)) {
          room.logicRoom.processEvent({ type: 'leave-room', payload: { id: socket.user.id } })
          await redis.saveRoom(room)
      }

      socket.leave(roomId)
      broadcastState(roomId, room)
      console.log(`[SOCKET] User ${socket.user.id} left room: ${roomId}`)

      // Clean cache if room is empty
      if (room.logicRoom.users.length === 0) {
          roomCache.delete(roomId)
          console.log(`[SOCKET] Room ${roomId} cache cleared (no users)`)
      }
    }
  } catch (err) {
    console.error(`[SOCKET] Leave room error for ${socket.id}:`, err)
  }
}

const onJoinRoom = async (socket: SocketWithUser, roomId: string): Promise<void> => {
  try {
    if (!socket.user) {
      console.error('[SOCKET] User extraction failed')
      return
    }

    const room = await getRoomInstance(roomId)
    if (!room) {
        console.error(`[SOCKET] Room ${roomId} not found for join`)
        return
    }

    if (!room.isUserInRoom(socket.user)) {
        room.logicRoom.processEvent({ type: 'join-room', payload: { id: socket.user.id, name: socket.user.name } })
        await redis.saveRoom(room)
    }

    socket.join(roomId)

    console.log(`[SOCKET] User ${socket.user.id} joined room: ${roomId}`)

    broadcastState(roomId, room)

    // Register individual event listeners
    socket.on('ready', (isReady: boolean) => {
      handleGameEvent(socket, roomId, { type: 'ready', payload: { id: socket.user!.id, isReady } })
    })

    socket.on('add', (text: string) => {
      handleGameEvent(socket, roomId, { type: 'add', payload: { id: socket.user!.id, text } })
    })

    socket.on('change-settings', (settings: { rounds?: number; timer?: number }) => {
      handleGameEvent(socket, roomId, { type: 'change-settings', payload: settings })
    })

    // Handle disconnect by leaving room
    socket.on('disconnect', () => {
      onLeaveRoom(socket, roomId)
    })
  } catch (err) {
    console.error(`[SOCKET] Join room error for ${socket.id}:`, err)
  }
}

export default initWebSockets
