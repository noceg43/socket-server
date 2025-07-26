"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: Switch to dotenv-flow for managing multiple environment files
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    PORT: process.env.PORT,
    REDIS_HOST: process.env.NODE_ENV === 'test'
        ? process.env.TEST_REDIS_HOST
        : process.env.REDIS_HOST,
    REDIS_PORT: process.env.NODE_ENV === 'test'
        ? process.env.TEST_REDIS_PORT
        : process.env.REDIS_PORT,
    REDIS_USERNAME: process.env.NODE_ENV === 'test'
        ? process.env.TEST_REDIS_USERNAME
        : process.env.REDIS_USERNAME,
    REDIS_PASSWORD: process.env.NODE_ENV === 'test'
        ? process.env.TEST_REDIS_PASSWORD
        : process.env.REDIS_PASSWORD,
    JWT_SECRET: process.env.JWT_SECRET || 'your_very_secret_key' // Added JWT Secret
};
exports.default = config;
//# sourceMappingURL=config.js.map