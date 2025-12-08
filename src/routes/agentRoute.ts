import express from 'express'
import { ask } from '../controllers/agentController'

export const agentRouter = express.Router()

agentRouter.get('/', ask)
