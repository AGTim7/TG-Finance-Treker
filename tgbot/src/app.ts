import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { webhookCallback } from 'grammy'

import categoriesRoutes from './api/routes/categories.routes'
import dashboardRoutes from './api/routes/dashboard.routes'
import transactionsRoutes from './api/routes/transactions.routes'
import analyticsRoutes from './api/routes/analytics.routes'
import { ApiError } from './api/errors/apiError'
import { errorHandler } from './api/middleware/errorHandler.middleware'
import { notFoundHandler } from './api/middleware/notFound.middleware'
import { telegramAuthMiddleware } from './api/middleware/telegramAuth.middleware'
import { env } from './config/env'
import bot from './bot/index'
import { prisma } from './prisma/client'

const app = express()
const allowedOrigins = new Set(env.CORS_ORIGINS)

if (env.TRUST_PROXY) {
  app.set('trust proxy', 1)
}

app.disable('x-powered-by')
app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true)
      return
    }

    callback(new ApiError(403, 'Origin is not allowed by CORS'))
  },
}))
app.use(rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health',
  message: { message: 'Too many requests. Try again later.' },
}))
app.use(express.json({ limit: '32kb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ ok: true })
  } catch (error) {
    console.error('Readiness check failed:', error)
    res.status(503).json({ ok: false })
  }
})

if (env.TELEGRAM_UPDATE_MODE === 'webhook') {
  app.post('/api/telegram/webhook', webhookCallback(bot, 'express', {
    secretToken: env.TELEGRAM_WEBHOOK_SECRET,
    timeoutMilliseconds: 9_000,
  }))
}

app.use('/api/categories', telegramAuthMiddleware, categoriesRoutes)
app.use('/api/dashboard', telegramAuthMiddleware, dashboardRoutes)
app.use('/api/transactions', telegramAuthMiddleware, transactionsRoutes)
app.use('/api/analytics', telegramAuthMiddleware, analyticsRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
