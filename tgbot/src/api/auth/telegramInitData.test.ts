import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { describe, it } from 'node:test'

import { ApiError } from '../errors/apiError'
import { validateTelegramInitData } from './telegramInitData'

const BOT_TOKEN = '123456:test-token'
const NOW = 1_700_000_000

function signedInitData(values: Record<string, string>) {
  const params = new URLSearchParams(values)
  const dataCheckString = Array.from(params.entries())
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest()
  const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex')
  params.set('hash', hash)
  return params.toString()
}

describe('validateTelegramInitData', () => {
  it('accepts valid signed Telegram data', () => {
    const initData = signedInitData({
      auth_date: NOW.toString(),
      query_id: 'test-query',
      user: JSON.stringify({ id: 123456, username: 'tester' }),
    })

    assert.deepEqual(validateTelegramInitData(initData, BOT_TOKEN, 86_400, NOW), {
      id: 123456,
      username: 'tester',
    })
  })

  it('rejects data changed after signing', () => {
    const initData = signedInitData({
      auth_date: NOW.toString(),
      user: JSON.stringify({ id: 123456 }),
    }).replace('123456', '654321')

    assert.throws(
      () => validateTelegramInitData(initData, BOT_TOKEN, 86_400, NOW),
      (error) => error instanceof ApiError && error.statusCode === 401,
    )
  })

  it('rejects expired data', () => {
    const initData = signedInitData({
      auth_date: (NOW - 86_401).toString(),
      user: JSON.stringify({ id: 123456 }),
    })

    assert.throws(
      () => validateTelegramInitData(initData, BOT_TOKEN, 86_400, NOW),
      /expired/,
    )
  })

  it('rejects malformed hashes before comparison', () => {
    const params = new URLSearchParams({
      auth_date: NOW.toString(),
      user: JSON.stringify({ id: 123456 }),
      hash: 'not-hex',
    })

    assert.throws(
      () => validateTelegramInitData(params.toString(), BOT_TOKEN, 86_400, NOW),
      /valid hash/,
    )
  })
})
