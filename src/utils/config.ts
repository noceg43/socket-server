// Minimal dotenv setup
import dotenv from 'dotenv'
import { Config } from '@/types'

dotenv.config()

const config: Config = {
  PORT: process.env.PORT,

  REDIS_HOST: process.env.NODE_ENV === 'test'
    ? process.env.TEST_REDIS_HOST
    : process.env.REDIS_HOST,

  REDIS_PORT: process.env.NODE_ENV === 'test'
    ? process.env.TEST_REDIS_PORT
    : process.env.REDIS_PORT,

  REDIS_USERNAME: process.env.NODE_ENV === 'test'
    ? process.env.TEST_REDIS_USERNAME
    : process.env.REDIS_USERNAME,

  REDIS_PASSWORD: process.env.NODE_ENV === 'test'
    ? process.env.TEST_REDIS_PASSWORD
    : process.env.REDIS_PASSWORD,

  JWT_SECRET: process.env.JWT_SECRET || 'your_very_secret_key' // Added JWT Secret
}

export default config
