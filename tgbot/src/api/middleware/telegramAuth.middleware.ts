import type { NextFunction, Request, Response } from 'express'

import { ApiError } from '../errors/apiError'
import { UserService } from '../../services/users.service'
import { env } from '../../config/env'
import { validateTelegramInitData } from '../auth/telegramInitData'

export async function telegramAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const authorization = req.header('Authorization')

    if (!authorization?.startsWith('tma ')) {
      throw new ApiError(401, 'Telegram authorization data is required')
    }

    const telegramUser = validateTelegramInitData(
      authorization.slice(4),
      env.BOT_TOKEN,
      env.TELEGRAM_INIT_DATA_MAX_AGE_SECONDS,
    )
    const user = await UserService.upsertTelegramUser(
      telegramUser.id.toString(),
      telegramUser.username,
    )

    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}
