import { describe, expect, it } from 'vitest'

import { getPeriodRange } from './period'

describe('getPeriodRange', () => {
  const now = new Date(2026, 6, 16, 12, 0, 0)

  it('returns local calendar boundaries for the current month', () => {
    const result = getPeriodRange('current-month', now)
    const from = new Date(result.from!)
    const to = new Date(result.to!)

    expect(from.getFullYear()).toBe(2026)
    expect(from.getMonth()).toBe(6)
    expect(from.getDate()).toBe(1)
    expect(to.getMonth()).toBe(7)
    expect(to.getDate()).toBe(1)
  })

  it('moves to the previous calendar month', () => {
    const result = getPeriodRange('previous-month', now)
    const from = new Date(result.from!)

    expect(from.getMonth()).toBe(5)
    expect(result.shortLabel).toBe('Июнь')
  })

  it('omits boundaries for all-time analytics', () => {
    expect(getPeriodRange('all-time', now)).toMatchObject({
      from: undefined,
      to: undefined,
      shortLabel: 'Все время',
    })
  })
})
