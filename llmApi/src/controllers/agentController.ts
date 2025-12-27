import { type Request, type Response } from 'express'

export const get = async (req: Request, res: Response) => {
  const { name } = req.params

  res.json({ success: true, message: `hello you called agent ${name}` })
}

export const post = async (req: Request, res: Response) => {
  const { model } = req.body

  res.json({ success: true, message: `POST request received, ${model}` })
}
