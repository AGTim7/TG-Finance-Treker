import { Router } from 'express'

import { DashboardService } from '../../services/dashboard.service'
import { WalletServiceError } from '../../services/wallets.service'
import { ApiError } from '../errors/apiError'
import { parseUuid } from '../validation/resources.validation'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const walletId = parseUuid(req.query.walletId, 'walletId', true)
    const dashboard = await DashboardService.getForUser(req.user!.id, walletId)
    return res.json(dashboard)
  } catch (error) {
    if (error instanceof WalletServiceError) {
      return next(new ApiError(error.statusCode, error.message))
    }
    return next(error)
  }
})

export default router
