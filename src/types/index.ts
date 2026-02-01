import { z } from 'zod'
import { Socket } from 'socket.io'
import { Request } from 'express'

// Constants
export const MAX_USERS_PER_ROOM = 6 // Increased for a typical game

// UserIcon enum
export enum UserIcon {
  ILLUMINATI_EYE = 'illuminati_eye',
  EMF_DETECTOR = 'emf_detector',
  REPTILIANS = 'reptilians',
  UFO = 'ufo',
  FLAT_EARTH = 'flat_earth',
  MOLOCH = 'moloch',
  PYRAMIDS = 'pyramids',
  DOLPHINS = 'dolphins'
}

export const UserIconSchema = z.nativeEnum(UserIcon)

export const UserSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  name: z.string().min(1, 'User name is required'),
})

export const UserInfoSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  joinTimestamp: z.coerce.date(),
  userIcon: UserIconSchema,
})

// ==========================================
// STATE SCHEMAS
// ==========================================

export enum RoomStatus {
  JOIN = 'join',
  FILL = 'fill',
  STARTED = 'started',
  FINISHED = 'finished',
}

export const GameSettingsSchema = z.object({
  nRounds: z.number().default(3),
  timerDuration: z.number().default(60),
});

const BaseStateSchema = z.object({
  gameSettings: GameSettingsSchema,
});

export const JoinStateSchema = BaseStateSchema.extend({
  status: z.literal(RoomStatus.JOIN),
  readyUsersId: z.array(z.string()).default([]),
});

export const FillStateSchema = BaseStateSchema.extend({
  status: z.literal(RoomStatus.FILL),
});

export const StartedStateSchema = BaseStateSchema.extend({
  status: z.literal(RoomStatus.STARTED),
});

export const FinishedStateSchema = BaseStateSchema.extend({
  status: z.literal(RoomStatus.FINISHED),
});

export const RoomStateSchema = z.discriminatedUnion('status', [
  JoinStateSchema,
  FillStateSchema,
  StartedStateSchema,
  FinishedStateSchema,
]);

// ==========================================
// ROOM SCHEMA
// ==========================================

export const RoomSchema = z.object({
  id: z.string().min(1, 'Room ID is required'),
  joinedPlayers: z.array(UserSchema).max(MAX_USERS_PER_ROOM, `Room can have maximum ${MAX_USERS_PER_ROOM} players`).default([]),
  userInfoList: z.array(UserInfoSchema).max(MAX_USERS_PER_ROOM, `Room can have maximum ${MAX_USERS_PER_ROOM} user info entries`).default([]),
  // Updated to use the discriminated union
  state: RoomStateSchema,
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
export const SocketEventSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  event: z.record(z.unknown()),
})

// Inferred Types
export type User = z.infer<typeof UserSchema>;
export type UserInfo = z.infer<typeof UserInfoSchema>;
export type GameSettings = z.infer<typeof GameSettingsSchema>;
// RoomStateData is the raw JSON shape
export type RoomStateData = z.infer<typeof RoomStateSchema>;
// Room type now strictly includes the state
export type Room = z.infer<typeof RoomSchema>;

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;
export type CreateRoomRequest = z.infer<typeof CreateRoomRequestSchema>;
export type SocketJoinRoom = z.infer<typeof SocketJoinRoomSchema>;
export type SocketLeaveRoom = z.infer<typeof SocketLeaveRoomSchema>;
export type SocketEvent = z.infer<typeof SocketEventSchema>;

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