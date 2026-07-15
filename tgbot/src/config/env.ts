import 'dotenv/config'

function required(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

function positiveInteger(name: string, fallback: number, maximum = Number.MAX_SAFE_INTEGER) {
  const raw = process.env[name]
  if (raw === undefined) return fallback

  const value = Number(raw)
  if (!Number.isInteger(value) || value <= 0 || value > maximum) {
    throw new Error(`${name} must be a positive integer not greater than ${maximum}`)
  }

  return value
}

function booleanValue(name: string, fallback: boolean) {
  const raw = process.env[name]
  if (raw === undefined) return fallback
  if (raw === 'true') return true
  if (raw === 'false') return false
  throw new Error(`${name} must be true or false`)
}

const nodeEnv = process.env.NODE_ENV?.trim() || 'development'
const processRole = process.env.PROCESS_ROLE?.trim() || 'all'
const telegramUpdateMode = process.env.TELEGRAM_UPDATE_MODE?.trim() || 'polling'

if (processRole !== 'all' && processRole !== 'api' && processRole !== 'bot') {
  throw new Error('PROCESS_ROLE must be all, api, or bot')
}

if (telegramUpdateMode !== 'polling' && telegramUpdateMode !== 'webhook') {
  throw new Error('TELEGRAM_UPDATE_MODE must be polling or webhook')
}

const telegramWebhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim()
if (telegramUpdateMode === 'webhook') {
  if (!telegramWebhookSecret) {
    throw new Error('TELEGRAM_WEBHOOK_SECRET must be configured in webhook mode')
  }

  if (!/^[A-Za-z0-9_-]{1,256}$/.test(telegramWebhookSecret)) {
    throw new Error('TELEGRAM_WEBHOOK_SECRET has an invalid format')
  }
}

const configuredOrigins = process.env.CORS_ORIGINS
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

if (nodeEnv === 'production' && processRole !== 'bot' && !configuredOrigins?.length) {
  throw new Error('CORS_ORIGINS must be configured in production')
}

export const env = Object.freeze({
  NODE_ENV: nodeEnv,
  PROCESS_ROLE: processRole,
  TELEGRAM_UPDATE_MODE: telegramUpdateMode,
  TELEGRAM_WEBHOOK_SECRET: telegramWebhookSecret,
  BOT_TOKEN: required('BOT_TOKEN'),
  DATABASE_URL: required('DATABASE_URL'),
  API_PORT: process.env.PORT === undefined
    ? positiveInteger('API_PORT', 3000, 65_535)
    : positiveInteger('PORT', 3000, 65_535),
  CORS_ORIGINS: configuredOrigins?.length
    ? configuredOrigins
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  TELEGRAM_INIT_DATA_MAX_AGE_SECONDS: positiveInteger(
    'TELEGRAM_INIT_DATA_MAX_AGE_SECONDS',
    86_400,
  ),
  RATE_LIMIT_WINDOW_MS: positiveInteger('RATE_LIMIT_WINDOW_MS', 60_000),
  RATE_LIMIT_MAX_REQUESTS: positiveInteger('RATE_LIMIT_MAX_REQUESTS', 120),
  TRUST_PROXY: booleanValue('TRUST_PROXY', false),
})
