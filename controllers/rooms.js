const Room = require('../models/room')
const User = require('../models/user')
const { UniqueCharOTP } = require('unique-string-generator')
const roomsRouter = require('express').Router()
const { insertRoom, joinRoom } = require('../utils/redis')

roomsRouter.get('/', async (request, response) => {
  response.json({ message: 'Hello from rooms!' })
})


roomsRouter.post('/create', async (request, response) => {
  try {
    const userId = request.user.id
    const user = User.fromRequestData(userId, request.body)

    const id = UniqueCharOTP(4)
    const newRoom = Room.create(id, user)

    await insertRoom(newRoom)
    response.status(201).json(newRoom)
  } catch (error) {
    response.status(400).json({ error: error.message })
  }
})

roomsRouter.post('/join/:id', async (request, response) => {
  const { id } = request.params
  const userId = request.user.id

  try {
    const user = User.fromRequestData(userId, request.body)
    const updatedRoom = await joinRoom(id, user)
    response.json(updatedRoom)
  }
  catch (error) {
    response.status(400).json({ error: error.message })
  }
})


module.exports = roomsRouter