import express from 'express'
import { healthCheck } from '../controllers/healthzController'

export const healthzRouter = express.Router()

healthzRouter.get('/', healthCheck)
