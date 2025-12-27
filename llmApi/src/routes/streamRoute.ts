import express from 'express'
import { get } from '../controllers/streamController'

export const streamRouter = express.Router()

streamRouter.get('/', get)
