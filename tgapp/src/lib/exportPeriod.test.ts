import { describe, expect, it } from 'vitest'

import { getExportPeriod } from './exportPeriod'

describe('getExportPeriod', () => {
  it('builds an all-time export without date boundaries', () => {
    const result = getExportPeriod('all-time', '', '', new Date(2026, 6, 19))
    expect(result.isValid).toBe(true)
    expect(result.input.from).toBeUndefined()
    expect(result.input.to).toBeUndefined()
  })

  it('treats the custom end date as inclusive', () => {
    const result = getExportPeriod('custom', '2026-07-10', '2026-07-12', new Date(2026, 6, 19))
    expect(result.isValid).toBe(true)
    expect(result.input.from).toBe(new Date(2026, 6, 10).toISOString())
    expect(result.input.to).toBe(new Date(2026, 6, 13).toISOString())
  })

  it('rejects a reversed custom period', () => {
    const result = getExportPeriod('custom', '2026-07-12', '2026-07-10', new Date(2026, 6, 19))
    expect(result.isValid).toBe(false)
  })
})
