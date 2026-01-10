import express from 'express'
import { askRouter, askStreamRouter, healthzRouter } from './routes'
import { loadModels } from './controllers/askController'
import { loadModels as loadStreamModels } from './controllers/askStreamController'
import { authMiddleware } from '../utils/authMiddleware'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const port = process.env.PORT || 8000

// Initial load of LLM models
loadModels()
loadStreamModels()

// Routes
app.use('/healthz', healthzRouter)
app.use('/ask', authMiddleware, askRouter)
app.use('/ask-stream', authMiddleware, askStreamRouter)

// Default route
app.get('/', (req, res) => {
  res.send('Hello!')
})

// Start server
const server = app.listen(port, () => {
  console.info(`App listening on port ${port}`)
})

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use`)
    process.exit(1)
  } else {
    console.error('Server error:', error)
    process.exit(1)
  }
})
