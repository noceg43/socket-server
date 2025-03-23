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
    const user = User.fromMap(request.body.user)

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
  const { user } = request.body

  try {
    const updatedRoom = await joinRoom(id, User.fromMap(user))
    response.json(updatedRoom)
  }
  catch (error) {
    response.status(400).json({ error: error.message })
  }
})




module.exports = roomsRouter