import { RedisClientType } from 'redis';
import { Room } from '@/models/room';
import { User } from '@/models/user';
export declare const redisClient: RedisClientType;
export declare function insertRoom(room: Room): Promise<void>;
export declare function joinRoom(roomId: string, user: User): Promise<Room>;
export declare function leaveRoom(roomId: string, user: User): Promise<Room>;
export declare function getRoom(roomId: string): Promise<Room | null>;
export declare function saveRoom(room: Room): Promise<Room>;
declare const _default: {
    redisClient: RedisClientType;
    insertRoom: typeof insertRoom;
    joinRoom: typeof joinRoom;
    leaveRoom: typeof leaveRoom;
    getRoom: typeof getRoom;
    saveRoom: typeof saveRoom;
};
export default _default;
//# sourceMappingURL=redis.d.ts.map