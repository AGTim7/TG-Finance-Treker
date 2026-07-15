import { Prisma } from '@prisma/client'
import { Router } from 'express'

import { ApiError } from '../errors/apiError'
import { TransactionService, TransactionServiceError } from '../../services/transactions.service'

const router = Router()
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function parsePageValue(value: unknown, field: 'page' | 'limit', defaultValue: number) {
  if (value === undefined) return defaultValue
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new ApiError(400, `${field} must be a positive integer`)
  }

  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new ApiError(400, `${field} must be a positive integer`)
  }

  return parsed
}

router.post('/', async (req, res, next) => {
  try {
    const body: unknown = req.body

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ApiError(400, 'Request body must be an object')
    }

    const { categoryId, amount, description } = body as Record<string, unknown>

    if (typeof categoryId !== 'string' || !UUID_PATTERN.test(categoryId)) {
      throw new ApiError(400, 'categoryId must be a UUID')
    }

    if (typeof amount !== 'string' && typeof amount !== 'number') {
      throw new ApiError(400, 'amount must be a number')
    }

    let decimalAmount: Prisma.Decimal
    try {
      decimalAmount = new Prisma.Decimal(amount)
    } catch {
      throw new ApiError(400, 'amount must be a valid number')
    }

    if (!decimalAmount.isFinite() || decimalAmount.lessThanOrEqualTo(0)) {
      throw new ApiError(400, 'amount must be greater than zero')
    }

    if (typeof description !== 'undefined' && typeof description !== 'string') {
      throw new ApiError(400, 'description must be a string')
    }

    const normalizedDescription = description?.trim()
    if (normalizedDescription && normalizedDescription.length > 500) {
      throw new ApiError(400, 'description must not be longer than 500 characters')
    }

    const transaction = await TransactionService.createForUser(req.user!.id, {
      categoryId,
      amount: decimalAmount,
      description: normalizedDescription || undefined,
    })

    return res.status(201).json({ item: transaction })
  } catch (error) {
    if (error instanceof TransactionServiceError) {
      return next(new ApiError(error.statusCode, error.message))
    }

    return next(error)
  }
})

router.get('/', async (req, res, next) => {
  try {
    const page = parsePageValue(req.query.page, 'page', 1)
    const requestedLimit = parsePageValue(req.query.limit, 'limit', 20)
    const limit = Math.min(requestedLimit, 50)
    const result = await TransactionService.getPageByUserId(req.user!.id, page, limit)

    return res.json(result)
  } catch (error) {
    return next(error)
  }
})

export default router
