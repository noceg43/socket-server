const { redisClient } = require('../utils/redis')
const { createAdapter } = require('@socket.io/redis-adapter')
const { instrument } = require('@socket.io/admin-ui')
const middleware = require('../utils/middleware')
const { getRoom } = require('../utils/redis')

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
    // Send an event every second
    /*     const intervalId = setInterval(() => {
      socket.emit('event', { time: new Date().toISOString() })
    }, 1000)

    // Clear the interval when the socket disconnects
    socket.on('disconnect', () => {
      clearInterval(intervalId)
    }) */

    // Add listener for "signin" event
    socket.on('signin', async (data, callback) => {
      try {
        console.log(`User ${socket.id} (${socket.user.id}) signed in with data:`, data)
        // You can add room joining logic here if needed
        if (callback) callback(null, { success: true, socketId: socket.id, userId: socket.user.id })
      } catch (err) {
        console.error(`Signin error for ${socket.id}:`, err.message)
        if (callback) callback(err, null)
      }
    })

    // Add listener for joining rooms
    socket.on('join-room', (roomId) => onJoinRoom(io, socket, roomId))

    // Add listener for leaving rooms
    socket.on('leave-room', (roomId, callback) => {
      try {
        socket.leave(roomId)
        console.log(`User ${socket.id} (${socket.user.id}) left room: ${roomId}`)
        socket.to(roomId).emit('user-left', { socketId: socket.id, userId: socket.user.id })
        if (callback) callback(null, { success: true, room: roomId })
      } catch (err) {
        console.error(`Leave room error for ${socket.id}:`, err.message)
        if (callback) callback(err, null)
      }
    })
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



const onJoinRoom = async (io, socket, roomId) => {
  const room = await getRoom(roomId)
  if (!room) {
    console.error(`Room ${roomId} not found`)
    return
  }
  socket.join(roomId)
  console.log(`User ${socket.id} joined room: ${roomId}`)
  // use io.sockets in order to notify the socket inside the room
  io.sockets.in(roomId).emit('event', { socketId: socket.id, userId: socket.user.id })

  // add a timestamp every second event
  const intervalId = setInterval(() => {
    io.sockets.in(roomId).emit('event', { time: new Date().toISOString() })
  }, 100)

  // Clear the interval when the socket disconnects
  socket.on('disconnect', () => {
    clearInterval(intervalId)
    console.log(`User ${socket.id} disconnected from room: ${roomId}`)
  })
}