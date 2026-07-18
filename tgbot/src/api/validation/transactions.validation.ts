import { ApiError } from '../errors/apiError'
import { parseTransactionAmount, TransactionAmountError } from '../../domain/transactionAmount'
import type { TransactionType } from '../../../generated/prisma/enums'
import { parseUuid } from './resources.validation'

export function parsePageValue(
  value: unknown,
  field: 'page' | 'limit',
  defaultValue: number,
  maximum = Number.MAX_SAFE_INTEGER,
) {
  if (value === undefined) return defaultValue
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new ApiError(400, `${field} must be a positive integer`)
  }

  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new ApiError(400, `${field} must be a positive integer not greater than ${maximum}`)
  }
  return parsed
}

export function parseTransactionType(value: unknown): TransactionType | undefined {
  if (value === undefined) return undefined
  if (value !== 'INCOME' && value !== 'EXPENSE') {
    throw new ApiError(400, 'type must be INCOME or EXPENSE')
  }
  return value
}

function parseDateValue(value: unknown, field: 'from' | 'to' | 'date') {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || value.length > 40) {
    throw new ApiError(400, `${field} must be a valid ISO date`)
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new ApiError(400, `${field} must be a valid ISO date`)
  return date
}

export function parseDateRange(fromValue: unknown, toValue: unknown) {
  const from = parseDateValue(fromValue, 'from')
  const to = parseDateValue(toValue, 'to')
  if (from && to && from >= to) throw new ApiError(400, 'from must be earlier than to')
  return { from, to }
}

function parseAmount(value: unknown) {
  try {
    return parseTransactionAmount(value)
  } catch (error) {
    if (error instanceof TransactionAmountError) throw new ApiError(400, error.message)
    throw error
  }
}

function parseDescription(value: unknown, optional: boolean) {
  if (optional && value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') throw new ApiError(400, 'description must be a string or null')
  const normalized = value.trim()
  if (normalized.length > 500) {
    throw new ApiError(400, 'description must not be longer than 500 characters')
  }
  return normalized || null
}

function parseBody(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'Request body must be an object')
  }
  return body as Record<string, unknown>
}

export function parseCreateTransactionBody(body: unknown) {
  const value = parseBody(body)
  return {
    categoryId: parseUuid(value.categoryId, 'categoryId')!,
    walletId: parseUuid(value.walletId, 'walletId', true),
    amount: parseAmount(value.amount),
    description: parseDescription(value.description, true) ?? undefined,
    date: parseDateValue(value.date, 'date'),
  }
}

export function parseUpdateTransactionBody(body: unknown) {
  const value = parseBody(body)
  const allowed = ['categoryId', 'walletId', 'amount', 'description', 'date']
  if (!allowed.some((field) => field in value)) {
    throw new ApiError(400, 'At least one editable field is required')
  }

  return {
    categoryId: parseUuid(value.categoryId, 'categoryId', true),
    walletId: parseUuid(value.walletId, 'walletId', true),
    amount: value.amount === undefined ? undefined : parseAmount(value.amount),
    description: parseDescription(value.description, true),
    date: parseDateValue(value.date, 'date'),
  }
}
