const {redisClient} = require('../utils/redis');
const {createAdapter} = require('@socket.io/redis-adapter');
const { instrument } = require("@socket.io/admin-ui");
const middleware = require('../utils/middleware')
const {getRoom} = require('../utils/redis');

module.exports = initWebSockets = (server) => {
    // Initialize Socket.io with CORS configuration
    const io = require('socket.io')(server, {
        cors: {
            origin: ["https://admin.socket.io"],
            credentials: true
        }
    });

    io.use(middleware.socketUserExtractor);
    
    // Setup admin UI with anonymous auth
    instrument(io, {
        auth: false,
        mode: "development",
        namespaceName: "/admin",
        readonly: false
    });
    
    // Replace in-memory adapter with Redis
    const subClient = redisClient.duplicate();
    io.adapter(createAdapter(redisClient, subClient));
    
    // Log admin UI access information
    console.log('Socket.IO Admin UI is available at: https://admin.socket.io');
    console.log('Server URL to connect: http://localhost:' + (process.env.PORT || 3001));
    console.log('Auth: Disabled (anonymous access)');
    
    // Add error handlers
    redisClient.on('error', err => {
        console.error(err.message);
    });
    
    subClient.on('error', err => {
        console.error(err.message);
    });
    
    // Listen for new connection
    io.on('connection', socket => {
        console.log(`User connected: ${socket.id}, User ID: ${socket.user?.id}`);
        
        // Add listener for "signin" event
        socket.on('signin', async (data, callback) => {
            try {
                console.log(`User ${socket.id} (${socket.user.id}) signed in with data:`, data);
                // You can add room joining logic here if needed
                if (callback) callback(null, { success: true, socketId: socket.id, userId: socket.user.id });
            } catch (err) {
                console.error(`Signin error for ${socket.id}:`, err.message);
                if (callback) callback(err, null);
            }
        });
        
        // Add listener for joining rooms
        socket.on('join-room', onJoinRoom);
        
        // Add listener for leaving rooms
        socket.on('leave-room', (roomId, callback) => {
            try {
                socket.leave(roomId);
                console.log(`User ${socket.id} (${socket.user.id}) left room: ${roomId}`);
                socket.to(roomId).emit('user-left', { socketId: socket.id, userId: socket.user.id });
                if (callback) callback(null, { success: true, room: roomId });
            } catch (err) {
                console.error(`Leave room error for ${socket.id}:`, err.message);
                if (callback) callback(err, null);
            }
        });
    
        // Add listener for disconnection
        socket.on('disconnect', (reason) => {
            console.log(`User disconnected: ${socket.id} (${socket.user?.id}), reason: ${reason}`);
        });
    });
    
    return io;
}



const onJoinRoom = async (socket, roomId) => {

    const room = await getRoom(roomId);
    if (!room) {
        console.error(`Room ${roomId} not found for user ${socket.id}`);
        return;
    }
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
    socket.to(roomId).emit('user-joined', { socketId: socket.id, userId: socket.user.id });
}