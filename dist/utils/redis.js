"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
exports.insertRoom = insertRoom;
exports.joinRoom = joinRoom;
exports.leaveRoom = leaveRoom;
exports.getRoom = getRoom;
exports.saveRoom = saveRoom;
const redis_1 = require("redis");
const config_1 = __importDefault(require("./config"));
const room_1 = require("@/models/room");
const user_1 = require("@/models/user");
const EXPIRATION_TIME = 60 * 60; // 1 hour in seconds
// Instantiate the Redis client
exports.redisClient = (0, redis_1.createClient)({
    username: config_1.default.REDIS_USERNAME,
    password: config_1.default.REDIS_PASSWORD,
    socket: {
        host: config_1.default.REDIS_HOST,
        port: config_1.default.REDIS_PORT ? parseInt(config_1.default.REDIS_PORT, 10) : undefined
    }
});
// Connect to the Redis server
(async () => {
    try {
        await exports.redisClient.connect();
    }
    catch (error) {
        console.error('Failed to connect to Redis:', error);
    }
})();
async function insertRoom(room) {
    if (!(room instanceof room_1.Room)) {
        throw new Error('Invalid room object');
    }
    // create if not exists else return error
    const exists = await exports.redisClient.exists(room.id);
    if (exists === 1) {
        throw new Error('Room already exists');
    }
    else {
        await saveRoom(room);
    }
}
async function joinRoom(roomId, user) {
    const exists = await exports.redisClient.exists(roomId);
    if (exists === 0) {
        throw new Error('Room not found');
    }
    if (!(user instanceof user_1.User)) {
        throw new Error('Invalid user object');
    }
    const roomData = await exports.redisClient.get(roomId);
    if (!roomData) {
        throw new Error('Room data not found');
    }
    const room = room_1.Room.fromRoomData(JSON.parse(roomData));
    if (!room.isUserInRoom(user)) {
        room.addUser(user);
        await saveRoom(room);
    }
    return room;
}
async function leaveRoom(roomId, user) {
    const exists = await exports.redisClient.exists(roomId);
    if (exists === 0) {
        throw new Error('Room not found');
    }
    if (!(user instanceof user_1.User)) {
        throw new Error('Invalid user object');
    }
    const roomData = await exports.redisClient.get(roomId);
    if (!roomData) {
        throw new Error('Room data not found');
    }
    const room = room_1.Room.fromRoomData(JSON.parse(roomData));
    if (room.isUserInRoom(user)) {
        room.removeUser(user);
        await saveRoom(room);
    }
    return room;
}
async function getRoom(roomId) {
    const exists = await exports.redisClient.exists(roomId);
    if (exists !== 0) {
        const roomData = await exports.redisClient.get(roomId);
        if (roomData) {
            return room_1.Room.fromRoomData(JSON.parse(roomData));
        }
    }
    return null;
}
async function saveRoom(room) {
    if (!(room instanceof room_1.Room)) {
        throw new Error('Invalid room object');
    }
    await exports.redisClient.set(room.id, JSON.stringify(room), { EX: EXPIRATION_TIME });
    return room;
}
exports.default = {
    redisClient: exports.redisClient,
    insertRoom,
    joinRoom,
    leaveRoom,
    getRoom,
    saveRoom
};
//# sourceMappingURL=redis.js.map