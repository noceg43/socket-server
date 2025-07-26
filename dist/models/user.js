"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const types_1 = require("@/types");
const errors_1 = require("@/errors");
class User {
    id;
    name;
    constructor(id, name) {
        try {
            // Validate input using Zod schema
            const validatedData = types_1.UserSchema.parse({ id, name });
            this.id = validatedData.id;
            this.name = validatedData.name;
        }
        catch {
            throw new errors_1.ValidationError('Invalid user data provided');
        }
    }
    static fromUserData(userData) {
        try {
            const validatedData = types_1.UserSchema.parse(userData);
            return new User(validatedData.id, validatedData.name);
        }
        catch {
            throw new errors_1.ValidationError('Invalid user data format');
        }
    }
    static fromRequestData(userId, body = {}) {
        if (!userId) {
            throw new errors_1.UserError('User ID is required', 400);
        }
        if (!body.name) {
            throw new errors_1.UserError('User name is required', 400);
        }
        return new User(userId, body.name);
    }
}
exports.User = User;
exports.default = User;
//# sourceMappingURL=user.js.map