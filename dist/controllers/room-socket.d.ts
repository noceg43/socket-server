import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
declare const initWebSockets: (server: HttpServer) => Promise<SocketIOServer>;
export default initWebSockets;
//# sourceMappingURL=room-socket.d.ts.map