import { Router } from 'express'
import type { TransactionType } from '../../../generated/prisma/enums'

import { ApiError } from '../errors/apiError'
import { CategoryService } from '../../services/categories.service'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const type = req.query.type
    if (type !== undefined && type !== 'INCOME' && type !== 'EXPENSE') {
      throw new ApiError(400, 'type must be INCOME or EXPENSE')
    }

    const items = await CategoryService.getAvailableForUser(
      req.user!.id,
      type as TransactionType | undefined,
    )

    return res.json({ items })
  } catch (error) {
    return next(error)
  }
})

export default router
