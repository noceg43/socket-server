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

export async function insertRoom(room: Room): Promise<void> {
  if (!(room instanceof Room)) {
    throw new Error('Invalid room object')
  }

  // create if not exists else return error
  const exists = await redisClient.exists(room.id)
  if (exists === 1) {
    throw new Error('Room already exists')
  } else {
    await saveRoom(room)
  }
}

export async function joinRoom(roomId: string, user: User): Promise<Room> {
  const exists = await redisClient.exists(roomId)
  if (exists === 0) {
    throw new Error('Room not found')
  }

  if (!(user instanceof User)) {
    throw new Error('Invalid user object')
  }

  const roomData = await redisClient.get(roomId)
  if (!roomData) {
    throw new Error('Room data not found')
  }

  const room = Room.fromRoomData(JSON.parse(roomData))

  if (!room.isUserInRoom(user)) {
    room.addUser(user)
    await saveRoom(room)
  }

  return room
}

export async function leaveRoom(roomId: string, user: User): Promise<Room> {
  const exists = await redisClient.exists(roomId)
  if (exists === 0) {
    throw new Error('Room not found')
  }

  if (!(user instanceof User)) {
    throw new Error('Invalid user object')
  }

  const roomData = await redisClient.get(roomId)
  if (!roomData) {
    throw new Error('Room data not found')
  }

  const room = Room.fromRoomData(JSON.parse(roomData))

  if (room.isUserInRoom(user)) {
    room.removeUser(user)
    await saveRoom(room)
  }

  return room
}

export async function getRoom(roomId: string): Promise<Room | null> {
  const exists = await redisClient.exists(roomId)
  if (exists !== 0) {
    const roomData = await redisClient.get(roomId)
    if (roomData) {
      return Room.fromRoomData(JSON.parse(roomData))
    }
  }
  return null
}

export async function saveRoom(room: Room): Promise<Room> {
  if (!(room instanceof Room)) {
    throw new Error('Invalid room object')
  }

  await redisClient.set(room.id, JSON.stringify(room), { EX: EXPIRATION_TIME })
  return room
}

export default {
  redisClient,
  insertRoom,
  joinRoom,
  leaveRoom,
  getRoom,
  saveRoom
}
