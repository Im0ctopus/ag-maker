import { type Request, type Response } from 'express'

export const getModels = async (req: Request, res: Response) => {
  // TODO: call the getModels from all services and return it
  res.json({ success: true, message: `List models here` })
}

export const ask = async (req: Request, res: Response) => {
  const { model, prompt } = req.body

  res.json({ success: true, message: `POST request received, ${model}` })
}
