import type { NextFunction, Request, Response } from 'express'

type RateLimitEntry = {
  count: number
  resetAt: number
}

const requests = new Map<string, RateLimitEntry>()

export function apiRateLimit(req: Request, res: Response, next: NextFunction) {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000)
  const maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 120)
  const now = Date.now()
  const key = req.ip || 'unknown'
  const current = requests.get(key)

  if (requests.size > 10_000) {
    for (const [storedKey, entry] of requests) {
      if (entry.resetAt <= now) requests.delete(storedKey)
    }
  }

  const entry = !current || current.resetAt <= now
    ? { count: 1, resetAt: now + windowMs }
    : { ...current, count: current.count + 1 }

  requests.set(key, entry)
  res.setHeader('RateLimit-Limit', maxRequests)
  res.setHeader('RateLimit-Remaining', Math.max(0, maxRequests - entry.count))
  res.setHeader('RateLimit-Reset', Math.ceil(entry.resetAt / 1000))

  if (entry.count > maxRequests) {
    res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000))
    return res.status(429).json({ message: 'Too many requests. Try again later.' })
  }

  next()
}
