import { type Request, type Response } from 'express'
import { settings } from '../utils/getSettings'

export const healthCheck = (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    agents: Object.keys(settings),
  })
}
