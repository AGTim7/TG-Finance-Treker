import crypto from 'crypto'

import { ApiError } from '../errors/apiError'

export type TelegramWebAppUser = {
  id: number
  username?: string
}

export function validateTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds: number,
  nowSeconds = Math.floor(Date.now() / 1000),
): TelegramWebAppUser {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')

  if (!hash || !/^[0-9a-f]{64}$/i.test(hash)) {
    throw new ApiError(401, 'Telegram init data does not contain a valid hash')
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
  if (!crypto.timingSafeEqual(receivedHash, expectedHash)) {
    throw new ApiError(401, 'Telegram init data is invalid')
  }

  const authDate = Number(params.get('auth_date'))
  if (
    !Number.isInteger(authDate) ||
    authDate <= 0 ||
    authDate > nowSeconds + 300 ||
    nowSeconds - authDate > maxAgeSeconds
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
    !Number.isSafeInteger(user.id) ||
    user.id <= 0
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
