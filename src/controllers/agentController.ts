import { type Request, type Response } from 'express'

export const ask = async (req: Request, res: Response) => {
  const { name } = req.params
  res.json({ success: true, message: `hello you called agent ${name}` })
}

// You can add more controller functions here
