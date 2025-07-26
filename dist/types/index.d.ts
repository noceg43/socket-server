import { z } from 'zod';
import { Socket } from 'socket.io';
import { Request } from 'express';
export declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
}, {
    id: string;
    name: string;
}>;
export declare const RoomSchema: z.ZodObject<{
    id: z.ZodString;
    joinedPlayers: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
    }, {
        id: string;
        name: string;
    }>, "many">>;
    state: z.ZodDefault<z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    joinedPlayers: {
        id: string;
        name: string;
    }[];
    state: Record<string, unknown> | null;
}, {
    id: string;
    joinedPlayers?: {
        id: string;
        name: string;
    }[] | undefined;
    state?: Record<string, unknown> | null | undefined;
}>;
export declare const TokenPayloadSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodLiteral<"device-token">;
    iat: z.ZodOptional<z.ZodNumber>;
    exp: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: "device-token";
    iat?: number | undefined;
    exp?: number | undefined;
}, {
    id: string;
    type: "device-token";
    iat?: number | undefined;
    exp?: number | undefined;
}>;
export declare const CreateRoomRequestSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export declare const JoinRoomRequestSchema: z.ZodObject<{
    roomId: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    roomId: string;
}, {
    name: string;
    roomId: string;
}>;
export declare const SocketJoinRoomSchema: z.ZodString;
export declare const SocketLeaveRoomSchema: z.ZodString;
export declare const SocketEventSchema: z.ZodObject<{
    roomId: z.ZodString;
    event: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    roomId: string;
    event: Record<string, unknown>;
}, {
    roomId: string;
    event: Record<string, unknown>;
}>;
export declare const EventDataSchema: z.ZodRecord<z.ZodString, z.ZodUnknown>;
export type User = z.infer<typeof UserSchema>;
export type Room = z.infer<typeof RoomSchema>;
export type TokenPayload = z.infer<typeof TokenPayloadSchema>;
export type CreateRoomRequest = z.infer<typeof CreateRoomRequestSchema>;
export type JoinRoomRequest = z.infer<typeof JoinRoomRequestSchema>;
export type SocketJoinRoom = z.infer<typeof SocketJoinRoomSchema>;
export type SocketLeaveRoom = z.infer<typeof SocketLeaveRoomSchema>;
export type SocketEvent = z.infer<typeof SocketEventSchema>;
export interface AuthenticationResult {
    error?: string;
    status?: number;
    user?: TokenPayload;
}
export interface SocketUserData {
    id: string;
    name?: string;
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
//# sourceMappingURL=index.d.ts.map