"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
// @ts-expect-error - unique-string-generator doesn't have types
const unique_string_generator_1 = require("unique-string-generator");
const room_1 = require("@/models/room");
const redis_1 = require("@/utils/redis");
const errors_1 = require("@/errors");
const roomsRouter = (0, express_1.Router)();
roomsRouter.get('/', async (request, response) => {
    response.json({ message: 'Hello from rooms!' });
});
roomsRouter.post('/create', async (request, response) => {
    try {
        const id = (0, unique_string_generator_1.UniqueCharOTP)(4);
        const newRoom = room_1.Room.create(id);
        await (0, redis_1.insertRoom)(newRoom);
        response.status(201).json(newRoom);
    }
    catch (error) {
        if (error instanceof errors_1.AppError) {
            response.status(error.statusCode).json({
                error: error.message,
                code: error.errorCode
            });
        }
        else {
            const serverError = new errors_1.InternalServerError('Failed to create room');
            response.status(serverError.statusCode).json({
                error: serverError.message,
                code: serverError.errorCode
            });
        }
    }
});
exports.default = roomsRouter;
//# sourceMappingURL=rooms.js.map