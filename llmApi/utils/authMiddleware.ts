import type { NextFunction, Request, Response } from 'express'

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { authorization } = req.headers
  const secret = process.env.SECRET

  if (!secret) return next()

  if (!authorization || authorization !== `Bearer ${secret}`)
    return res.status(401).json({ message: 'Unauthorized' })

  next()
}
