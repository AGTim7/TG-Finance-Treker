import { Router } from 'express'

import { ApiError } from '../errors/apiError'
import { parseTransactionExportBody } from '../validation/exports.validation'
import {
  TransactionExportError,
  TransactionExportService,
} from '../../services/transactionExports.service'

const router = Router()

router.post('/transactions', async (req, res, next) => {
  try {
    const result = await TransactionExportService.sendToTelegram(
      req.user!,
      parseTransactionExportBody(req.body),
    )
    return res.json(result)
  } catch (error) {
    if (error instanceof TransactionExportError) {
      return next(new ApiError(error.statusCode, error.message))
    }
    return next(error)
  }
})

export default router
