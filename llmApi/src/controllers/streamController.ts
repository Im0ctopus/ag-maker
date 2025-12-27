import { type Request, type Response } from 'express'

export const get = async (req: Request, res: Response) => {
  res.write(`${JSON.stringify({ message: 'Hello mfs', finish: false })}\n`)

  setTimeout(() => {
    res.write(`data:${JSON.stringify({ finish: true })}\n\n`)
    res.end()
  }, 10000)
}
