import { Router } from 'express'
import type { TransactionType } from '../../../generated/prisma/enums'

import { ApiError } from '../errors/apiError'
import {
  parseCreateCategoryBody,
  parseUpdateCategoryBody,
  parseUuid,
} from '../validation/resources.validation'
import { CategoryService, CategoryServiceError } from '../../services/categories.service'

const router = Router()

function handleCategoryError(error: unknown) {
  if (error instanceof CategoryServiceError) return new ApiError(error.statusCode, error.message)
  return error
}

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
    return next(handleCategoryError(error))
  }
})

router.post('/', async (req, res, next) => {
  try {
    const item = await CategoryService.createForUser(req.user!.id, parseCreateCategoryBody(req.body))
    return res.status(201).json({ item })
  } catch (error) {
    return next(handleCategoryError(error))
  }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const item = await CategoryService.updateForUser(
      req.user!.id,
      parseUuid(req.params.id, 'id')!,
      parseUpdateCategoryBody(req.body),
    )
    return res.json({ item })
  } catch (error) {
    return next(handleCategoryError(error))
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await CategoryService.archiveForUser(req.user!.id, parseUuid(req.params.id, 'id')!)
    return res.status(204).send()
  } catch (error) {
    return next(handleCategoryError(error))
  }
})

export default router
