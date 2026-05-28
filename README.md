# Hot Take - TypeScript Conversion

A real-time WebSocket application built with Express.js, Socket.IO, and Redis, now fully converted to TypeScript with Zod validation.

## 🚀 Features

- **Full TypeScript Support**: Complete conversion from JavaScript to TypeScript with strict type checking
- **Zod Validation**: Runtime validation for all data structures including API requests, WebSocket events, and data models
- **WebSocket Communication**: Real-time bidirectional communication using Socket.IO
- **Redis Integration**: Persistent storage and session management with Redis
- **Authentication**: JWT-based authentication with HMAC signature validation
- **Admin UI**: Socket.IO Admin UI for monitoring connections and debugging
- **Rate Limiting**: Built-in rate limiting for API protection
- **Error Handling**: Comprehensive error handling with proper TypeScript error types

## 📁 Project Structure

```
src/
├── controllers/
│   ├── login.ts          # Authentication endpoints
│   ├── rooms.ts          # Room management endpoints
│   └── room-socket.ts    # WebSocket event handlers
├── models/
│   ├── room.ts          # Room data model with Zod validation
│   └── user.ts          # User data model with Zod validation
├── types/
│   └── index.ts         # TypeScript types and Zod schemas
├── utils/
│   ├── auth.ts          # Authentication utilities
│   ├── config.ts        # Environment configuration
│   ├── logger.ts        # Logging utilities
│   ├── middleware.ts    # Express and Socket.IO middleware
│   └── redis.ts         # Redis client and operations
├── app.ts               # Express application setup
└── index.ts             # Application entry point
```

## 🛠️ Technical Stack

- **Node.js** with **TypeScript**
- **Express.js** for REST API
- **Socket.IO** for WebSocket communication
- **Redis** for session storage and real-time data
- **Zod** for runtime validation
- **JWT** for authentication
- **ESLint** with TypeScript support for code quality

## 📋 Scripts

```bash
# Development
npm run dev          # Start development server with hot reload

# Production
npm run build        # Compile TypeScript to JavaScript
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint on TypeScript files
npm run clean        # Remove build directory

# Testing
npm run test         # Run tests (requires build first)
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=your_very_secret_key

# Test Redis Configuration (optional)
TEST_REDIS_HOST=localhost
TEST_REDIS_PORT=6379
TEST_REDIS_USERNAME=
TEST_REDIS_PASSWORD=
```

## 🏗️ TypeScript Conversion Details

### Key Improvements

1. **Type Safety**: All functions, variables, and data structures are properly typed
2. **Zod Validation**: Runtime validation ensures data integrity at API boundaries
3. **Better Error Handling**: Comprehensive error types and proper error propagation
4. **IDE Support**: Enhanced autocomplete, refactoring, and debugging capabilities
5. **Maintainability**: Self-documenting code with explicit type contracts

### Zod Schemas

- `UserSchema`: Validates user data with required ID and name
- `RoomSchema`: Validates room data with players and state
- `TokenPayloadSchema`: Validates JWT token structure
- `SocketEventSchema`: Validates WebSocket event data
- Request/Response schemas for API endpoints

### Socket.IO Integration

The WebSocket implementation includes:
- Type-safe event handlers
- Validated event data using Zod schemas
- Proper error handling for malformed data
- User authentication middleware for socket connections

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Redis server**:
   ```bash
   redis-server
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   - API: `http://localhost:3001`
   - Socket.IO Admin UI: `https://admin.socket.io`

## Render Deployment

This project installs `wth_logic` from a private GitHub repository over SSH.

On Render:

1. Add an environment variable named `SSH_KEY` containing the Base64-encoded private SSH key that has read access to `noceg43/wth_logic`:
   ```bash
   base64 -i id_ed25519
   ```
2. Set the build command to:
   ```bash
   npm run render:build
   ```
3. Set the start command to:
   ```bash
   npm run start
   ```

The build command decodes `SSH_KEY` into `~/.ssh/id_ecdsa`, trusts GitHub's host key, installs dependencies with `npm install`, and then builds the TypeScript output.

## 📡 API Endpoints

### Authentication
- `POST /api/login` - Get authentication token

### Rooms
- `GET /api/rooms` - List rooms (requires authentication)
- `POST /api/rooms/create` - Create new room (requires authentication)

### WebSocket Events
- `join-room` - Join a specific room
- `leave-room` - Leave a specific room
- `event` - Send/receive room events
- `disconnect` - Handle disconnection

## 🔍 Type Definitions

All types are defined in `src/types/index.ts` and include:

- `User`: User data structure
- `Room`: Room data structure with players and state
- `TokenPayload`: JWT token payload structure
- `AuthenticatedRequest`: Extended Express request with user data
- `SocketWithUser`: Extended Socket.IO socket with user data
- Various request/response types for API endpoints

## 🛡️ Security Features

- JWT authentication with configurable expiration
- HMAC signature validation for login requests
- Rate limiting on API endpoints
- Input validation using Zod schemas
- Secure WebSocket authentication

---

This project demonstrates a complete TypeScript conversion with modern best practices, comprehensive type safety, and runtime validation using Zod.
