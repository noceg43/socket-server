import { createClient, RedisClientType } from 'redis'
import config from './config'
import { Room } from '@/models/room'
import { User } from '@/models/user'

const EXPIRATION_TIME = 60 * 60 // 1 hour in seconds

// Instantiate the Redis client
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
  if (!(room instanceof Room)) {
    throw new Error('Invalid room object: Expected instance of Room')
  }

  const roomData = JSON.stringify(room)
  await redisClient.set(room.id, roomData, { EX: EXPIRATION_TIME })
  return room
}

/**
 * Inserts a new room into Redis, but only if it doesn't already exist.
 */
export async function insertRoom(room: Room): Promise<void> {
  if (!(room instanceof Room)) {
    throw new Error('Invalid room object: Expected instance of Room')
  }

  const exists = await redisClient.exists(room.id)
  if (exists === 1) {
    throw new Error('Room already exists')
  } else {
    // Correctly call saveRoom to actually persist the data
    await saveRoom(room)
  }
}

/**
 * Adds a user to a room and persists the change.
 */
export async function joinRoom(roomId: string, user: User): Promise<Room> {
  const room = await getRoom(roomId)
  if (!room) {
    throw new Error('Room not found')
  }

  if (!(user instanceof User)) {
    throw new Error('Invalid user object')
  }

  if (!room.isUserInRoom(user)) {
    room.logicRoom.processEvent({ type: 'join-room', payload: { id: user.id, name: user.name } })
    await saveRoom(room)
  }

  return room
}

/**
 * Removes a user from a room and persists the change.
 */
export async function leaveRoom(roomId: string, user: User): Promise<Room> {
  const room = await getRoom(roomId)
  if (!room) {
    throw new Error('Room not found')
  }

  if (!(user instanceof User)) {
    throw new Error('Invalid user object')
  }

  if (room.isUserInRoom(user)) {
    room.logicRoom.processEvent({ type: 'leave-room', payload: { id: user.id } })
    await saveRoom(room)
  }

  return room
}

/**
 * Retrieves a room from Redis and re-instantiates it.
 */
export async function getRoom(roomId: string): Promise<Room | null> {
  const roomData = await redisClient.get(roomId)
  if (roomData) {
    try {
      return Room.fromJSON(JSON.parse(roomData))
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
