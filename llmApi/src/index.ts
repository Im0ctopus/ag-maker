import express from 'express'
import { askRouter, askStreamRouter } from './routes'
import { loadModels } from './controllers/askController'
import { loadModels as loadStreamModels } from './controllers/askStreamController'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const port = process.env.PORT || 8000

// Initial load of LLM models
loadModels()
loadStreamModels()

// General MiddleWare
// We can also use the middleware only for specific routes if needed like the stream route below
app.use((req, res, next) => {
  const { authorization } = req.headers
  const secret = process.env.SECRET

  if (!secret) return next()

  if (!authorization || authorization !== `Bearer ${secret}`)
    return res.status(401).json({ message: 'Unauthorized' })

  next()
})

// Routes
app.use('/ask', askRouter)
app.use('/ask-stream', askStreamRouter)

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
