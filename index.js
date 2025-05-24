const { redisClient } = require('./utils/redis')
const pkg = require('./package')
const server = require('./app')
const initWebSockets  = require('./controllers/room-socket')

const PORT = parseInt(process.env.PORT) || 3001

// Start server
const wsServer = server.listen(PORT, () =>
  console.log(`${pkg.name}: listening on port ${PORT}`)
)

// Initialize WebSockets
initWebSockets(wsServer)



// Clean up resources on shutdown
process.on('SIGTERM', () => {
  console.log(`${pkg.name}: received SIGTERM`)
  redisClient.quit()
  process.exit(0)
})

module.exports = server
