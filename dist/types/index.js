"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventDataSchema = exports.SocketEventSchema = exports.SocketLeaveRoomSchema = exports.SocketJoinRoomSchema = exports.JoinRoomRequestSchema = exports.CreateRoomRequestSchema = exports.TokenPayloadSchema = exports.RoomSchema = exports.UserSchema = void 0;
const zod_1 = require("zod");
// Zod schemas for validation
exports.UserSchema = zod_1.z.object({
    id: zod_1.z.string().min(1, 'User ID is required'),
    name: zod_1.z.string().min(1, 'User name is required'),
});
exports.RoomSchema = zod_1.z.object({
    id: zod_1.z.string().min(1, 'Room ID is required'),
    joinedPlayers: zod_1.z.array(exports.UserSchema).default([]),
    state: zod_1.z.record(zod_1.z.unknown()).nullable().default(null),
});
exports.TokenPayloadSchema = zod_1.z.object({
    id: zod_1.z.string(),
    type: zod_1.z.literal('device-token'),
    iat: zod_1.z.number().optional(),
    exp: zod_1.z.number().optional(),
});
exports.CreateRoomRequestSchema = zod_1.z.object({
// Add any room creation parameters here if needed in the future
});
exports.JoinRoomRequestSchema = zod_1.z.object({
    roomId: zod_1.z.string().min(1, 'Room ID is required'),
    name: zod_1.z.string().min(1, 'User name is required'),
});
// Socket event schemas
exports.SocketJoinRoomSchema = zod_1.z.string().min(1, 'Room ID is required');
exports.SocketLeaveRoomSchema = zod_1.z.string().min(1, 'Room ID is required');
exports.SocketEventSchema = zod_1.z.object({
    roomId: zod_1.z.string().min(1, 'Room ID is required'),
    event: zod_1.z.record(zod_1.z.unknown()),
});
// Generic event data schema
exports.EventDataSchema = zod_1.z.record(zod_1.z.unknown());
//# sourceMappingURL=index.js.map