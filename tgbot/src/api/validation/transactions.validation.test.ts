import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { ApiError } from '../errors/apiError'
import {
  parseCreateTransactionBody,
  parseDateRange,
  parsePageValue,
  parseTransactionType,
} from './transactions.validation'

const CATEGORY_ID = '6ba7b810-9dad-41d1-80b4-00c04fd430c8'

describe('transaction request validation', () => {
  it('normalizes a valid transaction body', () => {
    const result = parseCreateTransactionBody({
      categoryId: CATEGORY_ID,
      amount: '1500.50',
      description: '  Продукты  ',
    })

    assert.equal(result.amount.toFixed(2), '1500.50')
    assert.equal(result.description, 'Продукты')
  })

  for (const amount of ['0', '-1', '1.001', '500abc', '10000000000']) {
    it(`rejects invalid amount ${amount}`, () => {
      assert.throws(
        () => parseCreateTransactionBody({ categoryId: CATEGORY_ID, amount }),
        (error) => error instanceof ApiError && error.statusCode === 400,
      )
    })
  }

  it('rejects invalid category IDs and long descriptions', () => {
    assert.throws(
      () => parseCreateTransactionBody({ categoryId: 'wrong', amount: '10' }),
      /UUID/,
    )
    assert.throws(
      () => parseCreateTransactionBody({
        categoryId: CATEGORY_ID,
        amount: '10',
        description: 'a'.repeat(501),
      }),
      /500 characters/,
    )
  })
})

describe('pagination validation', () => {
  it('uses the default and accepts positive integers', () => {
    assert.equal(parsePageValue(undefined, 'page', 1), 1)
    assert.equal(parsePageValue('20', 'limit', 10), 20)
  })

  for (const value of ['0', '-1', '1.5', 'abc']) {
    it(`rejects invalid pagination value ${value}`, () => {
      assert.throws(() => parsePageValue(value, 'page', 1), /positive integer/)
    })
  }

  it('rejects values above the configured maximum', () => {
    assert.throws(() => parsePageValue('51', 'limit', 20, 50), /not greater than 50/)
  })
})

describe('transaction filters validation', () => {
  it('accepts valid transaction types and empty filters', () => {
    assert.equal(parseTransactionType(undefined), undefined)
    assert.equal(parseTransactionType('INCOME'), 'INCOME')
    assert.equal(parseTransactionType('EXPENSE'), 'EXPENSE')
  })

  it('rejects an unknown transaction type', () => {
    assert.throws(() => parseTransactionType('ALL'), /INCOME or EXPENSE/)
  })

  it('parses an optional ISO date range', () => {
    const result = parseDateRange('2026-07-01T00:00:00.000Z', '2026-08-01T00:00:00.000Z')
    assert.equal(result.from?.toISOString(), '2026-07-01T00:00:00.000Z')
    assert.equal(result.to?.toISOString(), '2026-08-01T00:00:00.000Z')
  })

  it('rejects invalid and reversed date ranges', () => {
    assert.throws(() => parseDateRange('not-a-date', undefined), /valid ISO date/)
    assert.throws(
      () => parseDateRange('2026-08-01T00:00:00.000Z', '2026-07-01T00:00:00.000Z'),
      /earlier than/,
    )
  })
})
