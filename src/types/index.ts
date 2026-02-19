import { z } from 'zod'
import { Socket } from 'socket.io'
import { Request } from 'express'

// Constants
export const MAX_USERS_PER_ROOM = 8

export const UserSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  name: z.string().min(1, 'User name is required'),
})

// ==========================================
// OTHER SCHEMAS
// ==========================================

export const TokenPayloadSchema = z.object({
  id: z.string(),
  type: z.literal('device-token'),
  iat: z.number().optional(),
  exp: z.number().optional(),
})

export const CreateRoomRequestSchema = z.object({})

export const SocketJoinRoomSchema = z.string().min(1, 'Room ID is required')
export const SocketLeaveRoomSchema = z.string().min(1, 'Room ID is required')

// Inferred Types
export type User = z.infer<typeof UserSchema>;

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;
export type CreateRoomRequest = z.infer<typeof CreateRoomRequestSchema>;
export type SocketJoinRoom = z.infer<typeof SocketJoinRoomSchema>;
export type SocketLeaveRoom = z.infer<typeof SocketLeaveRoomSchema>;

export interface AuthenticationResult {
  error?: string;
  status?: number;
  user?: TokenPayload;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
  token?: string;
}

export interface SocketWithUser extends Socket {
  user?: import('../models/user').User;
}

export interface Config {
  PORT?: string;
  REDIS_HOST?: string;
  REDIS_PORT?: string;
  REDIS_USERNAME?: string;
  REDIS_PASSWORD?: string;
  JWT_SECRET: string;
}
