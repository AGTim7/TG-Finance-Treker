import { Router } from 'express'

import { DashboardService } from '../../services/dashboard.service'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const dashboard = await DashboardService.getForUser(req.user!.id)
    return res.json(dashboard)
  } catch (error) {
    return next(error)
  }
})

export default router
