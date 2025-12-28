import express from 'express'
import { ask, askStream } from '../controllers/agentController'
import { streamMiddleware } from '../middlewares/stream'

export const agentRouter = express.Router()

agentRouter.post('/ask', ask)
agentRouter.post('/ask-stream', streamMiddleware, askStream)
