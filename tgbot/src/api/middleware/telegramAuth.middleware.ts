import crypto from 'crypto'
import type { NextFunction, Request, Response } from 'express'

import { ApiError } from '../errors/apiError'
import { UserService } from '../../services/users.service'

type TelegramWebAppUser = {
  id: number
  username?: string
}

function validateTelegramInitData(initData: string, botToken: string): TelegramWebAppUser {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')

  if (!hash) {
    throw new ApiError(401, 'Telegram init data does not contain a hash')
  }

  params.delete('hash')

  const dataCheckString = Array.from(params.entries())
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest()

  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest()

  const receivedHash = Buffer.from(hash, 'hex')

  if (
    receivedHash.length !== expectedHash.length ||
    !crypto.timingSafeEqual(receivedHash, expectedHash)
  ) {
    throw new ApiError(401, 'Telegram init data is invalid')
  }

  const authDate = Number(params.get('auth_date'))
  const maxAgeSeconds = Number(process.env.TELEGRAM_INIT_DATA_MAX_AGE_SECONDS ?? 86_400)
  const now = Math.floor(Date.now() / 1000)

  if (
    !Number.isInteger(authDate) ||
    authDate <= 0 ||
    authDate > now + 300 ||
    now - authDate > maxAgeSeconds
  ) {
    throw new ApiError(401, 'Telegram init data has expired')
  }

  const userRaw = params.get('user')
  if (!userRaw) {
    throw new ApiError(401, 'Telegram init data does not contain a user')
  }

  let user: unknown

  try {
    user = JSON.parse(userRaw)
  } catch {
    throw new ApiError(401, 'Telegram user data is invalid')
  }

  if (
    !user ||
    typeof user !== 'object' ||
    !('id' in user) ||
    typeof user.id !== 'number' ||
    !Number.isSafeInteger(user.id)
  ) {
    throw new ApiError(401, 'Telegram user data is invalid')
  }

  return {
    id: user.id,
    username: 'username' in user && typeof user.username === 'string'
      ? user.username
      : undefined,
  }
}

export async function telegramAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const authorization = req.header('Authorization')

    if (!authorization?.startsWith('tma ')) {
      throw new ApiError(401, 'Telegram authorization data is required')
    }

    const botToken = process.env.BOT_TOKEN
    if (!botToken) {
      throw new Error('BOT_TOKEN is not configured')
    }

    const telegramUser = validateTelegramInitData(authorization.slice(4), botToken)
    const user = await UserService.upsertTelegramUser(
      telegramUser.id.toString(),
      telegramUser.username,
    )

    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}
