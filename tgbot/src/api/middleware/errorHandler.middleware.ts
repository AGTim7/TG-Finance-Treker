import type { NextFunction, Request, Response } from 'express'

import { ApiError } from '../errors/apiError'

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (res.headersSent) {
    return _next(error)
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({ message: error.message })
  }

  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ message: 'Request body must contain valid JSON' })
  }

  if (
    error &&
    typeof error === 'object' &&
    'type' in error &&
    error.type === 'entity.too.large'
  ) {
    return res.status(413).json({ message: 'Request body is too large' })
  }

  console.error(error)
  return res.status(500).json({ message: 'Internal server error' })
}
