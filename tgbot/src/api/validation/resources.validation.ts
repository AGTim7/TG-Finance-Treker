import { Prisma } from '../../../generated/prisma/client'
import type { TransactionType } from '../../../generated/prisma/enums'

import { ApiError } from '../errors/apiError'

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const COLOR_PATTERN = /^#[0-9a-f]{6}$/i
const DECIMAL_PATTERN = /^-?\d{1,10}(?:\.\d{1,2})?$/
const MAX_BALANCE = new Prisma.Decimal('9999999999.99')

function parseObject(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'Request body must be an object')
  }
  return body as Record<string, unknown>
}

export function parseUuid(value: unknown, field: string, optional = false) {
  if (optional && value === undefined) return undefined
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    throw new ApiError(400, `${field} must be a UUID`)
  }
  return value
}

function parseName(value: unknown, field: string, optional: boolean) {
  if (optional && value === undefined) return undefined
  if (typeof value !== 'string') throw new ApiError(400, `${field} must be a string`)
  const normalized = value.trim().replace(/\s+/g, ' ')
  if (normalized.length < 1 || normalized.length > 40) {
    throw new ApiError(400, `${field} must contain from 1 to 40 characters`)
  }
  return normalized
}

function parseEmoji(value: unknown, optional: boolean) {
  if (optional && value === undefined) return undefined
  if (typeof value !== 'string') throw new ApiError(400, 'emoji must be a string')
  const normalized = value.trim()
  if (normalized.length < 1 || Array.from(normalized).length > 8) {
    throw new ApiError(400, 'emoji has an invalid length')
  }
  return normalized
}

function parseColor(value: unknown, optional: boolean) {
  if (optional && value === undefined) return undefined
  if (typeof value !== 'string' || !COLOR_PATTERN.test(value)) {
    throw new ApiError(400, 'color must be a six-digit HEX value')
  }
  return value.toUpperCase()
}

function parseInitialBalance(value: unknown, optional: boolean) {
  if (optional && value === undefined) return undefined
  const normalized = String(value ?? '').trim().replace(',', '.')
  if (!DECIMAL_PATTERN.test(normalized)) {
    throw new ApiError(400, 'initialBalance must have no more than two decimal places')
  }
  const balance = new Prisma.Decimal(normalized)
  if (balance.abs().greaterThan(MAX_BALANCE)) {
    throw new ApiError(400, `initialBalance must be between -${MAX_BALANCE} and ${MAX_BALANCE}`)
  }
  return balance
}

export function parseCreateWalletBody(body: unknown) {
  const value = parseObject(body)
  return {
    name: parseName(value.name, 'name', false)!,
    emoji: parseEmoji(value.emoji, false)!,
    color: parseColor(value.color, false)!,
    initialBalance: parseInitialBalance(value.initialBalance ?? '0', false)!,
    isDefault: value.isDefault === true,
  }
}

export function parseUpdateWalletBody(body: unknown) {
  const value = parseObject(body)
  if (Object.keys(value).length === 0) throw new ApiError(400, 'At least one field is required')
  if (value.isDefault !== undefined && typeof value.isDefault !== 'boolean') {
    throw new ApiError(400, 'isDefault must be a boolean')
  }
  return {
    name: parseName(value.name, 'name', true),
    emoji: parseEmoji(value.emoji, true),
    color: parseColor(value.color, true),
    initialBalance: parseInitialBalance(value.initialBalance, true),
    isDefault: value.isDefault as boolean | undefined,
  }
}

function parseType(value: unknown, optional: boolean): TransactionType | undefined {
  if (optional && value === undefined) return undefined
  if (value !== 'INCOME' && value !== 'EXPENSE') {
    throw new ApiError(400, 'type must be INCOME or EXPENSE')
  }
  return value
}

export function parseCreateCategoryBody(body: unknown) {
  const value = parseObject(body)
  return {
    name: parseName(value.name, 'name', false)!,
    type: parseType(value.type, false)!,
    emoji: parseEmoji(value.emoji, false)!,
    color: parseColor(value.color, false)!,
  }
}

export function parseUpdateCategoryBody(body: unknown) {
  const value = parseObject(body)
  if (Object.keys(value).length === 0) throw new ApiError(400, 'At least one field is required')
  if (value.type !== undefined) throw new ApiError(400, 'Category type cannot be changed')
  return {
    name: parseName(value.name, 'name', true),
    emoji: parseEmoji(value.emoji, true),
    color: parseColor(value.color, true),
  }
}
