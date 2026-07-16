import { Router } from 'express'

import { ApiError } from '../errors/apiError'
import {
  parseCreateTransactionBody,
  parseDateRange,
  parsePageValue,
  parseTransactionType,
} from '../validation/transactions.validation'
import { TransactionService, TransactionServiceError } from '../../services/transactions.service'

const router = Router()

router.post('/', async (req, res, next) => {
  try {
    const data = parseCreateTransactionBody(req.body)
    const transaction = await TransactionService.createForUser(req.user!.id, data)
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
    const page = parsePageValue(req.query.page, 'page', 1, 100_000)
    const limit = parsePageValue(req.query.limit, 'limit', 20, 50)
    const type = parseTransactionType(req.query.type)
    const { from, to } = parseDateRange(req.query.from, req.query.to)
    const result = await TransactionService.getPageByUserId(
      req.user!.id,
      page,
      limit,
      { type, from, to },
    )

    return res.json(result)
  } catch (error) {
    if (error instanceof TransactionServiceError) {
      return next(new ApiError(error.statusCode, error.message))
    }

    return next(error)
  }
})

export default router
