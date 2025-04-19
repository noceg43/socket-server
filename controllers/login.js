const jwt = require('jsonwebtoken')
const loginRouter = require('express').Router()
const config = require('../utils/config')
const crypto = require('crypto')

const generateRandomId = () => {
  return crypto.randomBytes(16).toString('hex')
}

loginRouter.post('/', async (request, response) => {
  const tokenPayload = {
    id: 'device-' + generateRandomId(),
    type: 'device-token'
  }

  const token = jwt.sign(tokenPayload, config.JWT_SECRET)

  response
    .status(200)
    .send({ token })
})

module.exports = loginRouter
