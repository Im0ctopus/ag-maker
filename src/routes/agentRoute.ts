import express from 'express'
import { getModels, ask } from '../controllers/agentController'

export const agentRouter = express.Router()

agentRouter.get('/', getModels)
agentRouter.post('/ask', ask)
