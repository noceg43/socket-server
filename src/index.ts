import { createServer } from 'http'
import { redisClient } from '@/utils/redis'
import app from './app'
import initWebSockets from '@/controllers/room-socket'

// Import package.json for name
import packageInfo from '../package.json'

const PORT = parseInt(process.env.PORT || '3001', 10)

// Create HTTP server
const server = createServer(app)

// Start server
const wsServer = server.listen(PORT, () =>
  console.log(`${packageInfo.name}: listening on port ${PORT}`)
)

// Initialize WebSockets
initWebSockets(wsServer).catch((error) => {
  console.error('Failed to initialize WebSockets:', error)
  process.exit(1)
})

// Clean up resources on shutdown
process.on('SIGTERM', () => {
  console.log(`${packageInfo.name}: received SIGTERM`)
  redisClient.quit()
  process.exit(0)
})

export default server
