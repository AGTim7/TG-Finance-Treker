import { Prisma } from '@prisma/client'
import { Router } from 'express'

import { ApiError } from '../errors/apiError'
import { prisma } from '../../prisma/client'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const type = req.query.type

    if (type !== undefined && type !== 'INCOME' && type !== 'EXPENSE') {
      throw new ApiError(400, 'type must be INCOME or EXPENSE')
    }

    const where: Prisma.CategoryWhereInput = {
      OR: [{ userId: null }, { userId: req.user!.id }],
      ...(type ? { type } : {}),
    }

    const items = await prisma.category.findMany({
      where,
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })

    return res.json({ items })
  } catch (error) {
    return next(error)
  }
})

export default router
