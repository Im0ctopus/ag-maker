import express from 'express'
import { agentRouter } from './routes/agentRoute'

const app = express()
const port = 3000

// Routes
app.use('/agent', agentRouter)
// You can add more routers here

// Default route
app.get('/', (req, res) => {
  res.send('Hello!')
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})
