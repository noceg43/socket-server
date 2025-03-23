// TODO: Switch to dotenv-flow for managing multiple environment files
require('dotenv').config()

const PORT = process.env.PORT

const REDIS_HOST = process.env.NODE_ENV === 'test' ? process.env.TEST_REDIS_HOST : process.env.REDIS_HOST

const REDIS_PORT = process.env.NODE_ENV === 'test' ? process.env.TEST_REDIS_PORT : process.env.REDIS_PORT

const REDIS_USERNAME = process.env.NODE_ENV === 'test' ? process.env.TEST_REDIS_USERNAME : process.env.REDIS_USERNAME

const REDIS_PASSWORD = process.env.NODE_ENV === 'test' ? process.env.TEST_REDIS_PASSWORD : process.env.REDIS_PASSWORD

module.exports = {
  PORT,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_USERNAME,
  REDIS_PASSWORD
}