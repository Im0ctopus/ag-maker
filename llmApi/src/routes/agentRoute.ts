import express from 'express'
import { get, post } from '../controllers/agentController'

export const agentRouter = express.Router()

agentRouter.get('/:name', get)
agentRouter.post('/', post)
