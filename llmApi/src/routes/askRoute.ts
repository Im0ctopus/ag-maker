import express from 'express'
import { ask, getModels } from '../controllers/askController'

export const askRouter = express.Router()

askRouter.post('/', ask)
askRouter.get('/models', getModels)
