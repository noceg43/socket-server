const { REDIS_USERNAME, REDIS_PASSWORD, REDIS_HOST, REDIS_PORT } = require('./config')
const Room = require('../models/room')
const User = require('../models/user')


const EXPIRATION_TIME = 60 * 60 // 1 hour in seconds

// Instantiate the Redis client
const redisClient = require('redis').createClient({
  username: REDIS_USERNAME,
  password: REDIS_PASSWORD,
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT
  }
});


// Connect to the Redis server
(async () => {
  await redisClient.connect()
})()
// [END cloudrun_websockets_redis]

async function insertRoom(room) {
  if (room instanceof Room) {

    // create if not exists else return error
    if (await redisClient.exists(room.id) === 1) {
      throw new Error('Room already exists')
    } else {
      await saveRoom(room)
    }
  } else {
    throw new Error('Invalid room object')
  }
}

async function joinRoom(roomId, user) {

  if (await redisClient.exists(roomId) === 0) {
    throw new Error('Room not found')
  }

  if (!(user instanceof User)) {
    throw new Error('Invalid user object')
  }

  const room = Room.fromMap(JSON.parse(await redisClient.get(roomId)))

  if (!room.isUserInRoom(user)) {
    room.addUser(user)
    await saveRoom(room)
  }


  return room
}

async function leaveRoom(roomId, user) {
  if (await redisClient.exists(roomId) === 0) {
    throw new Error('Room not found')
  }

  if (!(user instanceof User)) {
    throw new Error('Invalid user object')
  }

  const room = Room.fromMap(JSON.parse(await redisClient.get(roomId)))

  if (room.isUserInRoom(user)) {
    room.removeUser(user)
    await saveRoom(room)
  }

  return room
}

async function getRoom(roomId) {
  if (await redisClient.exists(roomId) !== 0) {
    const roomData = JSON.parse(await redisClient.get(roomId))
    return Room.fromMap(roomData)
  }
}

async function saveRoom(room) {
  if (!(room instanceof Room)) {
    throw new Error('Invalid room object')
  }

  await redisClient.set(room.id, JSON.stringify(room), { EX: EXPIRATION_TIME })
  return room
}




module.exports = {
  redisClient,
  insertRoom,
  joinRoom,
  leaveRoom,
  getRoom
}
