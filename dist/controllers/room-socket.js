"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const admin_ui_1 = require("@socket.io/admin-ui");
const redis_1 = require("@/utils/redis");
const middleware_1 = __importDefault(require("@/utils/middleware"));
const redis = __importStar(require("@/utils/redis"));
const types_1 = require("@/types");
const initWebSockets = async (server) => {
    // Initialize Socket.io with CORS configuration
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: ['https://admin.socket.io'],
            credentials: true
        }
    });
    io.use(middleware_1.default.socketUserExtractor);
    // Setup admin UI with anonymous auth
    (0, admin_ui_1.instrument)(io, {
        auth: false,
        mode: 'development',
        namespaceName: '/admin',
        readonly: false
    });
    // Replace in-memory adapter with Redis
    const subClient = redis_1.redisClient.duplicate();
    if (!redis_1.redisClient.isOpen) {
        await redis_1.redisClient.connect();
    }
    await subClient.connect();
    io.adapter((0, redis_adapter_1.createAdapter)(redis_1.redisClient, subClient));
    // Log admin UI access information
    console.log('Socket.IO Admin UI is available at: https://admin.socket.io');
    console.log('Server URL to connect: http://localhost:' + (process.env.PORT || 3001));
    console.log('Auth: Disabled (anonymous access)');
    // Add error handlers
    redis_1.redisClient.on('error', (err) => {
        console.error(err.message);
    });
    subClient.on('error', (err) => {
        console.error(err.message);
    });
    // Listen for new connection
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}, User ID: ${socket.user?.id}`);
        // Add listener for joining rooms
        socket.on('join-room', (roomId) => {
            try {
                const validatedRoomId = types_1.SocketJoinRoomSchema.parse(roomId);
                onJoinRoom(io, socket, validatedRoomId);
            }
            catch (error) {
                console.error(`Invalid join-room data from ${socket.id}:`, error);
                socket.emit('error', { message: 'Invalid room ID format' });
            }
        });
        // Add listener for leaving rooms
        socket.on('leave-room', (roomId) => {
            try {
                const validatedRoomId = types_1.SocketLeaveRoomSchema.parse(roomId);
                onLeaveRoom(io, socket, validatedRoomId);
            }
            catch (error) {
                console.error(`Invalid leave-room data from ${socket.id}:`, error);
                socket.emit('error', { message: 'Invalid room ID format' });
            }
        });
        // Logs
        io.of('/').adapter.on('create-room', (room) => {
            console.log(`room ${room} was created`);
        });
        io.of('/').adapter.on('join-room', (room, id) => {
            console.log(`socket ${id} has joined room ${room}`);
        });
        // Add listener for disconnection
        socket.on('disconnect', (reason) => {
            console.log(`User disconnected: ${socket.id} (${socket.user?.id}), reason: ${reason}`);
        });
    });
    return io;
};
const onLeaveRoom = async (io, socket, roomId) => {
    try {
        socket.leave(roomId);
        if (socket.user) {
            const room = await redis.leaveRoom(roomId, socket.user);
            io.sockets.in(roomId).emit('event', room);
            console.log(`User ${socket.id} (${socket.user.id}) left room: ${roomId}`);
        }
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Leave room error for ${socket.id}:`, errorMessage);
    }
};
const onJoinRoom = async (io, socket, roomId) => {
    try {
        const room = await redis.getRoom(roomId);
        if (!room) {
            console.error(`Room ${roomId} not found`);
            return;
        }
        if (!socket.user) {
            console.error('Socket user not found');
            return;
        }
        const updatedRoom = await redis.joinRoom(roomId, socket.user);
        socket.join(roomId);
        console.log(`User ${socket.id} joined room: ${roomId}`);
        // use io.sockets in order to notify the socket inside the room
        io.sockets.in(roomId).emit('event', updatedRoom);
        // Send event to room
        socket.on('event', (roomId, event) => {
            console.log(`Event received in room ${roomId}:`, event);
            io.sockets.in(roomId).emit('event', event);
        });
        // Clear the interval when the socket disconnects
        socket.on('disconnect', () => {
            onLeaveRoom(io, socket, roomId);
        });
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Join room error for ${socket.id}:`, errorMessage);
    }
};
exports.default = initWebSockets;
//# sourceMappingURL=room-socket.js.map