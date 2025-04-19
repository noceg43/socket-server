const { test, after, beforeEach, before, describe } = require('node:test')
const supertest = require('supertest')
const assert = require('node:assert')
const { redisClient, insertRoom } = require('../utils/redis')
const app = require('../app')
const Room = require('../models/room')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const config = require('../utils/config')

const api = supertest(app)

let authToken // Variable to store the auth token
let userId // Variable to store user ID from the token

// Get auth token before running tests
before(async () => {
  const response = await api.post('/api/login')
  authToken = response.body.token
  assert(authToken, 'Failed to get auth token')

  // Decode the token to get the user ID
  const decoded = jwt.verify(authToken, config.JWT_SECRET)
  userId = decoded.id
})

beforeEach(async () => {
  await redisClient.flushAll()
})

describe('Room API', () => {

  test('should create a new room with valid token', async () => {
    const response = await api
      .post('/api/rooms/create')
      .set('Authorization', `Bearer ${authToken}`) // Add Authorization header
      .send({ name: 'Gigi' })
      .expect(201)
      .expect('Content-Type', /application\/json/)

    assert(response.body.id)
    assert(response.body.creator.id === userId)
    assert(response.body.creator.name === 'Gigi')
  })

  test('should not create a room without a token', async () => {
    await api
      .post('/api/rooms/create')
      // No Authorization header
      .send({ name: 'Gigi' })
      .expect(401) // Expect Unauthorized
      .expect('Content-Type', /application\/json/)
  })

  test('should create a room with default name when name is not provided', async () => {
    const response = await api
      .post('/api/rooms/create')
      .set('Authorization', `Bearer ${authToken}`) // Add Authorization header
      .send({})
      .expect(201)
      .expect('Content-Type', /application\/json/)

    assert(response.body.id)
    assert(response.body.creator.name === 'Anonymous')
  })

  test('should not create a room with an invalid token', async () => {
    const invalidToken = 'this.is.not.a.valid.token'
    await api
      .post('/api/rooms/create')
      .set('Authorization', `Bearer ${invalidToken}`) // Use an invalid token
      .send({ name: 'Gigi' })
      .expect(401) // Expect Unauthorized
      .expect('Content-Type', /application\/json/)
  })

  test('should not create a room with the same ID', async () => {
    const id = 'TEST'
    const user = new User(userId, 'Tester')
    const newRoom = Room.create(id, user)

    await redisClient.set(id, JSON.stringify(newRoom))

    try {
      await insertRoom(newRoom)
    }
    catch (error) {
      assert(error.message === 'Room already exists')
    }
  })

  test('should join an existing room with valid token', async () => {
    // Create a room first
    const id = 'TEST'
    const creator = new User('creator-123', 'Creator')
    const newRoom = Room.create(id, creator)
    await insertRoom(newRoom)

    const response = await api
      .post(`/api/rooms/join/${id}`)
      .set('Authorization', `Bearer ${authToken}`) // Add Authorization header
      .send({ name: 'Alex' })
      .expect(200)
      .expect('Content-Type', /application\/json/)

    assert(response.body.joinedPlayers.some(p => p.user.id === userId))
    assert(response.body.joinedPlayers.some(p => p.user.name === 'Alex'))
  })

  test('should not join a room without a token', async () => {
    const id = 'TEST'
    const creator = new User('creator-123', 'Creator')
    const newRoom = Room.create(id, creator)
    await insertRoom(newRoom)

    await api
      .post(`/api/rooms/join/${id}`)
      // No Authorization header
      .send({ name: 'Alex' })
      .expect(401) // Expect Unauthorized
      .expect('Content-Type', /application\/json/)
  })

  test('should not join a room with an invalid token', async () => {
    const id = 'TEST_INVALID_JOIN'
    const creator = new User('creator-123', 'Creator')
    const newRoom = Room.create(id, creator)
    await insertRoom(newRoom) // Setup room directly

    const invalidToken = 'this.is.also.not.valid'
    await api
      .post(`/api/rooms/join/${id}`)
      .set('Authorization', `Bearer ${invalidToken}`) // Use an invalid token
      .send({ name: 'Alex' })
      .expect(401) // Expect Unauthorized
      .expect('Content-Type', /application\/json/)
  })

  test('should not join a non-existing room', async () => {
    const response = await api
      .post('/api/rooms/join/NON_EXISTENT')
      .set('Authorization', `Bearer ${authToken}`) // Add Authorization header
      .send({ name: 'Alex' })
      .expect(400)
      .expect('Content-Type', /application\/json/)

    assert(response.body.error === 'Room not found')
  })

  test('should join a room with default name when name is not provided', async () => {
    // Create a room first
    const id = 'TEST_DEFAULT_NAME'
    const creator = new User('creator-123', 'Creator')
    const newRoom = Room.create(id, creator)
    await insertRoom(newRoom)

    const response = await api
      .post(`/api/rooms/join/${id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({}) // No name provided
      .expect(200)
      .expect('Content-Type', /application\/json/)

    assert(response.body.joinedPlayers.some(p => p.user.id === userId))
    assert(response.body.joinedPlayers.some(p => p.user.name === 'Anonymous'))
  })

  after(async () => {
    await redisClient.flushAll()
    await redisClient.disconnect()
  })
})
