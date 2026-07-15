import { Prisma } from '../../generated/prisma/client'

export const MAX_TRANSACTION_AMOUNT = new Prisma.Decimal('9999999999.99')

export class TransactionAmountError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TransactionAmountError'
  }
}

export function parseTransactionAmount(value: unknown) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new TransactionAmountError('amount must be a number')
  }

  const normalized = String(value).trim()
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw new TransactionAmountError('amount must have no more than two decimal places')
  }

  const amount = new Prisma.Decimal(normalized)
  if (amount.lessThanOrEqualTo(0)) {
    throw new TransactionAmountError('amount must be greater than zero')
  }

  if (amount.greaterThan(MAX_TRANSACTION_AMOUNT)) {
    throw new TransactionAmountError(`amount must not exceed ${MAX_TRANSACTION_AMOUNT.toFixed(2)}`)
  }

  return amount
}

export function assertTransactionAmount(amount: Prisma.Decimal) {
  return parseTransactionAmount(amount.toFixed())
}
