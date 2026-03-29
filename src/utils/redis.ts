import { createClient, RedisClientType } from 'redis'
import config from './config'
import { Room } from '@/models/room'
import { User } from '@/models/user'
import { Room as LogicRoom } from 'wth_logic'

const EXPIRATION_TIME = 60 * 60 // 1 hour in seconds

// Instantiate the Redis client (used for Socket.IO adapter pub/sub and state saving)
export const redisClient: RedisClientType = createClient({
  username: config.REDIS_USERNAME,
  password: config.REDIS_PASSWORD,
  socket: {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT ? parseInt(config.REDIS_PORT, 10) : undefined
  }
});

// Connect to the Redis server
(async (): Promise<void> => {
  try {
    await redisClient.connect()
  } catch (error) {
    console.error('Failed to connect to Redis:', error)
  }
})()

/**
 * Saves a room instance to Redis.
 */
export async function saveRoom(room: Room): Promise<Room> {
  const roomData = JSON.stringify(room)
  await redisClient.set(room.id, roomData, { EX: EXPIRATION_TIME })
  return room
}

/**
 * Inserts a new room into Redis, but only if it doesn't already exist.
 */
export async function insertRoom(room: Room): Promise<void> {
  const exists = await redisClient.exists(room.id)
  if (exists === 1) {
    throw new Error('Room already exists')
  } else {
    await saveRoom(room)
  }
}

/**
 * Adds a user to a room.
 */
export async function joinRoom(roomId: string, user: User): Promise<Room> {
  const room = await getRoom(roomId)
  if (!room) {
    throw new Error('Room not found')
  }

  if (!room.isUserInRoom(user)) {
    //TODO find a better way to handle this
    room.gameState.processEvent({ type: 'join-room', payload: { id: user.id, name: user.name } })
    await saveRoom(room)
  }

  return room
}

/**
 * Removes a user from a room.
 */
export async function leaveRoom(roomId: string, user: User): Promise<Room> {
  const room = await getRoom(roomId)
  if (!room) {
    throw new Error('Room not found')
  }

  if (room.isUserInRoom(user)) {
    room.gameState.processEvent({ type: 'leave-room', payload: { id: user.id } })
    await saveRoom(room)
  }

  return room
}

/**
 * Retrieves a room from Redis.
 */
export async function getRoom(roomId: string): Promise<Room | null> {
  const roomData = await redisClient.get(roomId)
  if (roomData) {
    try {
      const data = JSON.parse(roomData)
      return Room.fromJSON(data)
    } catch (e) {
      console.error(`Error parsing room ${roomId}:`, e)
      return null
    }
  }
  return null
}

export default {
  redisClient,
  insertRoom,
  joinRoom,
  leaveRoom,
  getRoom,
  saveRoom
}
