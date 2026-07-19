import assert from 'node:assert/strict'
import test from 'node:test'

import { ApiError } from '../errors/apiError'
import { parseTransactionExportBody } from './exports.validation'

test('parseTransactionExportBody accepts a bounded period and timezone', () => {
  const result = parseTransactionExportBody({
    from: '2026-07-01T00:00:00.000Z',
    to: '2026-08-01T00:00:00.000Z',
    timezoneOffsetMinutes: -180,
  })

  assert.equal(result.from?.toISOString(), '2026-07-01T00:00:00.000Z')
  assert.equal(result.to?.toISOString(), '2026-08-01T00:00:00.000Z')
  assert.equal(result.timezoneOffsetMinutes, -180)
})

test('parseTransactionExportBody accepts all-time export', () => {
  assert.deepEqual(parseTransactionExportBody({ timezoneOffsetMinutes: 0 }), {
    from: undefined,
    to: undefined,
    timezoneOffsetMinutes: 0,
  })
})

test('parseTransactionExportBody rejects partial periods and unknown fields', () => {
  assert.throws(
    () => parseTransactionExportBody({ from: '2026-07-01', timezoneOffsetMinutes: 0 }),
    (error) => error instanceof ApiError && error.statusCode === 400,
  )
  assert.throws(
    () => parseTransactionExportBody({ timezoneOffsetMinutes: 0, userId: 'foreign-user' }),
    (error) => error instanceof ApiError && error.statusCode === 400,
  )
})

test('parseTransactionExportBody rejects invalid timezone offsets', () => {
  assert.throws(
    () => parseTransactionExportBody({ timezoneOffsetMinutes: 841 }),
    (error) => error instanceof ApiError && error.statusCode === 400,
  )
})
