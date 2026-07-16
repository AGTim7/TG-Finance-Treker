import { Router } from 'express'

import { AnalyticsService } from '../../services/analytics.service'
import { parseDateRange, parseTransactionType } from '../validation/transactions.validation'

const router = Router()

router.get('/overview', async (req, res, next) => {
  try {
    const overview = await AnalyticsService.getOverviewForUser(req.user!.id)
    return res.json(overview)
  } catch (error) {
    return next(error)
  }
})

router.get('/', async (req, res, next) => {
  try {
    const type = parseTransactionType(req.query.type) ?? 'EXPENSE'
    const { from, to } = parseDateRange(req.query.from, req.query.to)
    const analytics = await AnalyticsService.getForUser(req.user!.id, { type, from, to })
    return res.json(analytics)
  } catch (error) {
    return next(error)
  }
})

export default router
