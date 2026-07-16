import { ApiError } from '../errors/apiError'
import { parseTransactionAmount, TransactionAmountError } from '../../domain/transactionAmount'
import type { TransactionType } from '../../../generated/prisma/enums'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

function parseDateValue(value: unknown, field: 'from' | 'to') {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || value.length > 40) {
    throw new ApiError(400, `${field} must be a valid ISO date`)
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, `${field} must be a valid ISO date`)
  }

  return date
}

export function parseDateRange(fromValue: unknown, toValue: unknown) {
  const from = parseDateValue(fromValue, 'from')
  const to = parseDateValue(toValue, 'to')

  if (from && to && from >= to) {
    throw new ApiError(400, 'from must be earlier than to')
  }

  return { from, to }
}

export function parseCreateTransactionBody(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'Request body must be an object')
  }

  const { categoryId, amount, description } = body as Record<string, unknown>
  if (typeof categoryId !== 'string' || !UUID_PATTERN.test(categoryId)) {
    throw new ApiError(400, 'categoryId must be a UUID')
  }

  let parsedAmount
  try {
    parsedAmount = parseTransactionAmount(amount)
  } catch (error) {
    if (error instanceof TransactionAmountError) {
      throw new ApiError(400, error.message)
    }
    throw error
  }

  if (description !== undefined && typeof description !== 'string') {
    throw new ApiError(400, 'description must be a string')
  }

  const normalizedDescription = description?.trim()
  if (normalizedDescription && normalizedDescription.length > 500) {
    throw new ApiError(400, 'description must not be longer than 500 characters')
  }

  return {
    categoryId,
    amount: parsedAmount,
    description: normalizedDescription || undefined,
  }
}
