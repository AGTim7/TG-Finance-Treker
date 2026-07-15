import type { NextFunction, Request, Response } from 'express'

import { ApiError } from '../errors/apiError'

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({ message: error.message })
  }

  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ message: 'Request body must contain valid JSON' })
  }

  console.error(error)
  return res.status(500).json({ message: 'Internal server error' })
}
