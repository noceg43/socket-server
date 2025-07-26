"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
const types_1 = require("@/types");
const errors_1 = require("@/errors");
const user_1 = require("./user");
class Room {
    id;
    joinedPlayers;
    state;
    constructor(id, joinedPlayers = [], state = null) {
        try {
            // Validate the basic structure - convert users to plain objects for validation
            const validatedData = types_1.RoomSchema.parse({
                id,
                joinedPlayers: joinedPlayers.map(user => ({ id: user.id, name: user.name })),
                state
            });
            this.id = validatedData.id;
            this.joinedPlayers = joinedPlayers;
            this.state = validatedData.state;
        }
        catch {
            throw new errors_1.ValidationError('Invalid room data');
        }
    }
    isUserInRoom(user) {
        if (!(user instanceof user_1.User)) {
            throw new errors_1.RoomError('Invalid user object provided', 400);
        }
        return this.joinedPlayers.some((joinedUser) => joinedUser.id === user.id);
    }
    static create(id) {
        if (!id) {
            throw new errors_1.RoomError('Room ID is required', 400);
        }
        return new Room(id);
    }
    addUser(user) {
        if (!(user instanceof user_1.User)) {
            throw new errors_1.RoomError('Invalid user object provided', 400);
        }
        const exists = this.joinedPlayers.some((joinedUser) => joinedUser.id === user.id);
        if (!exists) {
            this.joinedPlayers.push(user);
        }
    }
    removeUser(user) {
        if (!(user instanceof user_1.User)) {
            throw new errors_1.RoomError('Invalid user object provided', 400);
        }
        this.joinedPlayers = this.joinedPlayers.filter((joinedUser) => joinedUser.id !== user.id);
    }
    static fromRoomData(roomData) {
        try {
            const validatedData = types_1.RoomSchema.parse(roomData);
            const joinedPlayers = validatedData.joinedPlayers.map((userData) => user_1.User.fromUserData(userData));
            return new Room(validatedData.id, joinedPlayers, validatedData.state);
        }
        catch {
            throw new errors_1.ValidationError('Invalid room data format');
        }
    }
}
exports.Room = Room;
exports.default = Room;
//# sourceMappingURL=room.js.map