const { test, after, beforeEach } = require('node:test')
const supertest = require('supertest')
const assert = require('node:assert')
const { redisClient, insertRoom } = require('../utils/redis')
const app = require('../app')
const Room = require('../models/room')
const User = require('../models/user')

const api = supertest(app)

beforeEach(async () => {
  await redisClient.flushAll()
})

test('should create a new room', async () => {
  const user = new User('1234', 'Gigi')


  const response = await api
    .post('/api/rooms/create')
    .send({ user })
    .expect(201)
    .expect('Content-Type', /application\/json/)

  assert(response.body.id)
})

test('should not create a room without a user', async () => {
  const response = await api
    .post('/api/rooms/create')
    .send({})
    .expect(400)
    .expect('Content-Type', /application\/json/)

  assert(response.body.error === 'Invalid user object')
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


test('should join an existing room', async () => {
  const user = new User('1234', 'Gigi')
  const id = 'TEST'
  const newRoom = Room.create(id, user)

  await insertRoom(newRoom)

  const newUser = new User('5678', 'Alex')
  const response = await api
    .post(`/api/rooms/join/${id}`)
    .send({ user: newUser })
    .expect(200)
    .expect('Content-Type', /application\/json/)

  assert(response.body.joinedPlayers.some(u => u.user.id === newUser.id))
})

test('should not join a non-existing room', async () => {
  const user = new User('5678', 'Alex')
  const response = await api
    .post('/api/rooms/join/NON_EXISTENT')
    .send({ user })
    .expect(400)
    .expect('Content-Type', /application\/json/)

  assert(response.body.error === 'Room not found')
})

test('should not join a room without a user', async () => {
  const response = await api
    .post('/api/rooms/join/TEST')
    .send({})
    .expect(400)
    .expect('Content-Type', /application\/json/)

  assert(response.body.error === 'Invalid user object')
})


after(async () => {
  await redisClient.flushAll()
  await redisClient.disconnect()
})