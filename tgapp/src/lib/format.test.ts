import { afterEach, describe, expect, it, vi } from 'vitest'

import { formatMoney, formatTransactionDate } from './format'

describe('formatMoney', () => {
  it('formats decimal amounts with two fraction digits', () => {
    expect(formatMoney('1234.5')).toMatch(/^1\s234,50$/)
    expect(formatMoney('-10')).toBe('-10,00')
  })
})

describe('formatTransactionDate', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('uses compact relative labels for recent dates', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-16T12:00:00'))

    expect(formatTransactionDate('2026-07-16T09:00:00')).toBe('Сегодня')
    expect(formatTransactionDate('2026-07-15T09:00:00')).toBe('Вчера')
  })
})
