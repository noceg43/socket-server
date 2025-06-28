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
    const id = UniqueCharOTP(4)
    const newRoom = Room.create(id)

    await insertRoom(newRoom)
    response.status(201).json(newRoom)
  } catch (error) {
    response.status(400).json({ error: error.message })
  }
})

module.exports = roomsRouter