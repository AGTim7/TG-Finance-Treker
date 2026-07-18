import { Router } from 'express'

import { ApiError } from '../errors/apiError'
import {
  parseCreateTransactionBody,
  parseDateRange,
  parsePageValue,
  parseTransactionType,
  parseUpdateTransactionBody,
} from '../validation/transactions.validation'
import { parseUuid } from '../validation/resources.validation'
import { TransactionService, TransactionServiceError } from '../../services/transactions.service'

const router = Router()

function handleTransactionError(error: unknown) {
  if (error instanceof TransactionServiceError) return new ApiError(error.statusCode, error.message)
  return error
}

router.post('/', async (req, res, next) => {
  try {
    const item = await TransactionService.createForUser(req.user!.id, parseCreateTransactionBody(req.body))
    return res.status(201).json({ item })
  } catch (error) {
    return next(handleTransactionError(error))
  }
})

router.get('/', async (req, res, next) => {
  try {
    const page = parsePageValue(req.query.page, 'page', 1, 100_000)
    const limit = parsePageValue(req.query.limit, 'limit', 20, 50)
    const type = parseTransactionType(req.query.type)
    const walletId = parseUuid(req.query.walletId, 'walletId', true)
    const { from, to } = parseDateRange(req.query.from, req.query.to)
    const result = await TransactionService.getPageByUserId(
      req.user!.id,
      page,
      limit,
      { type, walletId, from, to },
    )
    return res.json(result)
  } catch (error) {
    return next(handleTransactionError(error))
  }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const item = await TransactionService.updateForUser(
      req.user!.id,
      parseUuid(req.params.id, 'id')!,
      parseUpdateTransactionBody(req.body),
    )
    return res.json({ item })
  } catch (error) {
    return next(handleTransactionError(error))
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await TransactionService.deleteForUser(req.user!.id, parseUuid(req.params.id, 'id')!)
    return res.status(204).send()
  } catch (error) {
    return next(handleTransactionError(error))
  }
})

export default router
