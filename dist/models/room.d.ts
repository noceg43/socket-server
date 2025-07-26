import { Room as RoomType } from '@/types';
import { User } from './user';
export declare class Room implements RoomType {
    readonly id: string;
    joinedPlayers: User[];
    state: Record<string, unknown> | null;
    constructor(id: string, joinedPlayers?: User[], state?: Record<string, unknown> | null);
    isUserInRoom(user: User): boolean;
    static create(id: string): Room;
    addUser(user: User): void;
    removeUser(user: User): void;
    static fromRoomData(roomData: unknown): Room;
}
export default Room;
//# sourceMappingURL=room.d.ts.map