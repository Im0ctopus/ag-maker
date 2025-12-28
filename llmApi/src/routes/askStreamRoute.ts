import express from 'express'
import { askStream, getModels } from '../controllers/askStreamController'
import { streamMiddleware } from '../../utils/streamMiddleware'

export const askStreamRouter = express.Router()

askStreamRouter.post('/', streamMiddleware, askStream)
askStreamRouter.get('/models', getModels)
