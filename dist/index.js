"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const redis_1 = require("@/utils/redis");
const app_1 = __importDefault(require("./app"));
const room_socket_1 = __importDefault(require("@/controllers/room-socket"));
// Import package.json for name
const package_json_1 = __importDefault(require("../package.json"));
const PORT = parseInt(process.env.PORT || '3001', 10);
// Create HTTP server
const server = (0, http_1.createServer)(app_1.default);
// Start server
const wsServer = server.listen(PORT, () => console.log(`${package_json_1.default.name}: listening on port ${PORT}`));
// Initialize WebSockets
(0, room_socket_1.default)(wsServer).catch((error) => {
    console.error('Failed to initialize WebSockets:', error);
    process.exit(1);
});
// Clean up resources on shutdown
process.on('SIGTERM', () => {
    console.log(`${package_json_1.default.name}: received SIGTERM`);
    redis_1.redisClient.quit();
    process.exit(0);
});
exports.default = server;
//# sourceMappingURL=index.js.map