import { Router } from 'express'

import { AnalyticsService } from '../../services/analytics.service'
import { WalletServiceError } from '../../services/wallets.service'
import { ApiError } from '../errors/apiError'
import { parseUuid } from '../validation/resources.validation'
import { parseDateRange, parseTransactionType } from '../validation/transactions.validation'

const router = Router()

function handleAnalyticsError(error: unknown) {
  if (error instanceof WalletServiceError) return new ApiError(error.statusCode, error.message)
  return error
}

router.get('/overview', async (req, res, next) => {
  try {
    const walletId = parseUuid(req.query.walletId, 'walletId', true)
    const overview = await AnalyticsService.getOverviewForUser(req.user!.id, new Date(), walletId)
    return res.json(overview)
  } catch (error) {
    return next(handleAnalyticsError(error))
  }
})

router.get('/', async (req, res, next) => {
  try {
    const type = parseTransactionType(req.query.type) ?? 'EXPENSE'
    const walletId = parseUuid(req.query.walletId, 'walletId', true)
    const { from, to } = parseDateRange(req.query.from, req.query.to)
    const analytics = await AnalyticsService.getForUser(req.user!.id, { type, walletId, from, to })
    return res.json(analytics)
  } catch (error) {
    return next(handleAnalyticsError(error))
  }
})

export default router
