import express from 'express'
import { agentRouter } from './routes/agentRoute'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const port = process.env.PORT || 3000

// Routes
app.use('/agent', agentRouter)

// Default route
app.get('/', (req, res) => {
  res.send('Hello!')
})

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
