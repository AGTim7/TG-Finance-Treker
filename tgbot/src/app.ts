import cors from 'cors'
import express from 'express'

import categoriesRoutes from './api/routes/categories.routes'
import transactionsRoutes from './api/routes/transactions.routes'
import { errorHandler } from './api/middleware/errorHandler.middleware'
import { notFoundHandler } from './api/middleware/notFound.middleware'
import { apiRateLimit } from './api/middleware/rateLimit.middleware'
import { securityHeaders } from './api/middleware/securityHeaders.middleware'
import { telegramAuthMiddleware } from './api/middleware/telegramAuth.middleware'

const app = express()
const configuredOrigins = process.env.CORS_ORIGINS
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const allowedOrigins = new Set(configuredOrigins?.length
  ? configuredOrigins
  : ['http://localhost:5173', 'https://financetrackerapp07.web.app'])

if (process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1)
}

app.disable('x-powered-by')

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true)
      return
    }

    callback(new Error('Origin is not allowed by CORS'))
  },
}))

app.use(apiRateLimit)
app.use(securityHeaders)
app.use(express.json({ limit: '32kb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/categories', telegramAuthMiddleware, categoriesRoutes)
app.use('/api/transactions', telegramAuthMiddleware, transactionsRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
