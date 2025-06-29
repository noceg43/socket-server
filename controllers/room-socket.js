const { redisClient } = require('../utils/redis')
const { createAdapter } = require('@socket.io/redis-adapter')
const { instrument } = require('@socket.io/admin-ui')
const middleware = require('../utils/middleware')
const redis = require('../utils/redis')

module.exports = initWebSockets = (server) => {
  // Initialize Socket.io with CORS configuration
  const io = require('socket.io')(server, {
    cors: {
      origin: ['https://admin.socket.io'],
      credentials: true
    }
  })

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
  io.adapter(createAdapter(redisClient, subClient))

  // Log admin UI access information
  console.log('Socket.IO Admin UI is available at: https://admin.socket.io')
  console.log('Server URL to connect: http://localhost:' + (process.env.PORT || 3001))
  console.log('Auth: Disabled (anonymous access)')

  // Add error handlers
  redisClient.on('error', err => {
    console.error(err.message)
  })

  subClient.on('error', err => {
    console.error(err.message)
  })

  // Listen for new connection
  io.on('connection', socket => {
    console.log(`User connected: ${socket.id}, User ID: ${socket.user?.id}`)
 
    // Add listener for joining rooms
    socket.on('join-room', (roomId) => onJoinRoom(io, socket, roomId))

    // Add listener for leaving rooms
    socket.on('leave-room', (roomId) => onLeaveRoom(io, socket, roomId))

    // Logs
    io.of('/').adapter.on('create-room', (room) => {
      console.log(`room ${room} was created`)
    })
    io.of('/').adapter.on('join-room', (room, id) => {
      console.log(`socket ${id} has joined room ${room}`)
    })
    // Add listener for disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.id} (${socket.user?.id}), reason: ${reason}`)
    })
  })

  return io
}


const onLeaveRoom = async (io, socket, roomId) => {
  try {
    socket.leave(roomId)
    const room = await redis.leaveRoom(roomId, socket.user)
    io.sockets.in(roomId).emit('event', room)
    console.log(`User ${socket.id} (${socket.user.id}) left room: ${roomId}`)
  } catch (err) {
    console.error(`Leave room error for ${socket.id}:`, err.message)
  }
}


const onJoinRoom = async (io, socket, roomId) => {
  const room = await redis.getRoom(roomId)
  if (!room) {
    console.error(`Room ${roomId} not found`)
    return
  }
  const updatedRoom = await redis.joinRoom(roomId, socket.user)
  socket.join(roomId)

  console.log(`User ${socket.id} joined room: ${roomId}`)
  // use io.sockets in order to notify the socket inside the room
  io.sockets.in(roomId).emit('event', updatedRoom)

  // Clear the interval when the socket disconnects
  socket.on('disconnect', () => {
    onLeaveRoom(io, socket, roomId)
  })
}