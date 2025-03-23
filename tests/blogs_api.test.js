const { test, after, beforeEach } = require('node:test')
const supertest = require('supertest')
const assert = require('node:assert')
const { redisClient, insertRoom } = require('../utils/redis')
const app = require('../app')
const Room = require('../models/room')

const api = supertest(app)

beforeEach(async () => {
  await redisClient.flushAll()
})

test('should create a new room', async () => {
  const response = await api
    .post('/api/rooms/create')
    .send()
    .expect(201)
    .expect('Content-Type', /application\/json/)

  assert(response.body.id)
})

test('should not create a room with the same ID', async () => {
  const id = 'TEST'
  const newRoom = new Room(id)

  await redisClient.set(id, JSON.stringify(newRoom))

  try {
    await insertRoom(newRoom)
  }
  catch (error) {
    assert(error.message === 'Room already exists')
  }
})

after(async () => {
  await redisClient.flushAll()
  await redisClient.disconnect()
})