import { z } from 'zod'
import { Socket } from 'socket.io'
import { Request } from 'express'

// Zod schemas for validation
export const UserSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  name: z.string().min(1, 'User name is required'),
})

export const RoomSchema = z.object({
  id: z.string().min(1, 'Room ID is required'),
  joinedPlayers: z.array(UserSchema).default([]),
  state: z.record(z.unknown()).nullable().default(null),
})

export const TokenPayloadSchema = z.object({
  id: z.string(),
  type: z.literal('device-token'),
  iat: z.number().optional(),
  exp: z.number().optional(),
})

export const CreateRoomRequestSchema = z.object({
  // Add any room creation parameters here if needed in the future
})

export const JoinRoomRequestSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  name: z.string().min(1, 'User name is required'),
})

// Socket event schemas
export const SocketJoinRoomSchema = z.string().min(1, 'Room ID is required')
export const SocketLeaveRoomSchema = z.string().min(1, 'Room ID is required')
export const SocketEventSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  event: z.record(z.unknown()),
})

// Generic event data schema
export const EventDataSchema = z.record(z.unknown())

// TypeScript types inferred from Zod schemas
export type User = z.infer<typeof UserSchema>;
export type Room = z.infer<typeof RoomSchema>;
export type TokenPayload = z.infer<typeof TokenPayloadSchema>;
export type CreateRoomRequest = z.infer<typeof CreateRoomRequestSchema>;
export type JoinRoomRequest = z.infer<typeof JoinRoomRequestSchema>;
export type SocketJoinRoom = z.infer<typeof SocketJoinRoomSchema>;
export type SocketLeaveRoom = z.infer<typeof SocketLeaveRoomSchema>;
export type SocketEvent = z.infer<typeof SocketEventSchema>;

// Additional types
export interface AuthenticationResult {
  error?: string;
  status?: number;
  user?: TokenPayload;
}

export interface SocketUserData {
  id: string;
  name?: string;
}

// Express middleware types
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
  token?: string;
}

// Socket.IO types
export interface SocketWithUser extends Socket {
  user?: import('../models/user').User;
}

// Environment configuration types
export interface Config {
  PORT?: string;
  REDIS_HOST?: string;
  REDIS_PORT?: string;
  REDIS_USERNAME?: string;
  REDIS_PASSWORD?: string;
  JWT_SECRET: string;
}
