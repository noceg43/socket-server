const Room = require('../models/room')
const { UniqueCharOTP } = require('unique-string-generator')
const roomsRouter = require('express').Router()
const { insertRoom } = require('../utils/redis')

roomsRouter.get('/', async (request, response) => {
  response.json({ message: 'Hello from rooms!' })
})


roomsRouter.post('/create', async (request, response) => {
  const id = UniqueCharOTP(4)

  const newRoom = new Room(id)
  try {
    await insertRoom(newRoom)
    response.status(201).json({ id })

  } catch (error) {
    response.status(400).json({ error: error.message })
  }

})



module.exports = roomsRouter