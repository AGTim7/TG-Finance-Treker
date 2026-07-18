import { Router } from 'express'

import { ApiError } from '../errors/apiError'
import { parseCreateWalletBody, parseUpdateWalletBody, parseUuid } from '../validation/resources.validation'
import { WalletService, WalletServiceError } from '../../services/wallets.service'

const router = Router()

function handleWalletError(error: unknown) {
  if (error instanceof WalletServiceError) return new ApiError(error.statusCode, error.message)
  return error
}

router.get('/', async (req, res, next) => {
  try {
    return res.json(await WalletService.getForUser(req.user!.id))
  } catch (error) {
    return next(handleWalletError(error))
  }
})

router.post('/', async (req, res, next) => {
  try {
    const wallet = await WalletService.createForUser(req.user!.id, parseCreateWalletBody(req.body))
    return res.status(201).json({ item: wallet })
  } catch (error) {
    return next(handleWalletError(error))
  }
})

router.patch('/:id', async (req, res, next) => {
  try {
    const wallet = await WalletService.updateForUser(
      req.user!.id,
      parseUuid(req.params.id, 'id')!,
      parseUpdateWalletBody(req.body),
    )
    return res.json({ item: wallet })
  } catch (error) {
    return next(handleWalletError(error))
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await WalletService.archiveForUser(req.user!.id, parseUuid(req.params.id, 'id')!)
    return res.status(204).send()
  } catch (error) {
    return next(handleWalletError(error))
  }
})

export default router
