import express from 'express'
import { agentRouter } from './routes/agentRoute'

const app = express()
const port = process.env.PORT || 3000

// Routes
app.use('/agent', agentRouter)

// Default route
app.get('/', (req, res) => {
  res.send('Hello!')
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})
