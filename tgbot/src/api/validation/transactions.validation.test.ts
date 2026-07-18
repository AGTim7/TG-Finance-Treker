import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { ApiError } from '../errors/apiError'
import {
  parseCreateTransactionBody,
  parseDateRange,
  parsePageValue,
  parseTransactionType,
  parseUpdateTransactionBody,
} from './transactions.validation'
import {
  parseCreateCategoryBody,
  parseCreateWalletBody,
  parseUpdateCategoryBody,
} from './resources.validation'

const CATEGORY_ID = '6ba7b810-9dad-41d1-80b4-00c04fd430c8'
const WALLET_ID = '8d8f4c31-48ef-4ab8-b54f-ad6b97f201b8'

describe('transaction request validation', () => {
  it('normalizes a valid transaction body', () => {
    const result = parseCreateTransactionBody({
      categoryId: CATEGORY_ID,
      walletId: WALLET_ID,
      amount: '1500.50',
      description: '  Продукты  ',
    })

    assert.equal(result.amount.toFixed(2), '1500.50')
    assert.equal(result.walletId, WALLET_ID)
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

  it('accepts partial edits and requires at least one editable field', () => {
    const result = parseUpdateTransactionBody({
      walletId: WALLET_ID,
      description: null,
      date: '2026-07-18T12:00:00.000Z',
    })
    assert.equal(result.walletId, WALLET_ID)
    assert.equal(result.description, null)
    assert.equal(result.date?.toISOString(), '2026-07-18T12:00:00.000Z')
    assert.throws(() => parseUpdateTransactionBody({}), /editable field/)
  })
})

describe('wallet and category validation', () => {
  it('normalizes wallet input', () => {
    const result = parseCreateWalletBody({
      name: '  Мои   накопления ',
      emoji: '🏦',
      color: '#2481cc',
      initialBalance: '1250,50',
      isDefault: true,
    })
    assert.equal(result.name, 'Мои накопления')
    assert.equal(result.color, '#2481CC')
    assert.equal(result.initialBalance.toFixed(2), '1250.50')
    assert.equal(result.isDefault, true)
  })

  it('validates custom category input and keeps its type immutable', () => {
    const result = parseCreateCategoryBody({
      name: 'Подписки',
      type: 'EXPENSE',
      emoji: '📱',
      color: '#8B5CF6',
    })
    assert.equal(result.type, 'EXPENSE')
    assert.throws(
      () => parseUpdateCategoryBody({ type: 'INCOME' }),
      /cannot be changed/,
    )
  })
})
