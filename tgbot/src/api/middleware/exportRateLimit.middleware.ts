import rateLimit from 'express-rate-limit'

export const exportRateLimit = rateLimit({
  windowMs: 10 * 60_000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req) => req.user!.id,
  message: { message: 'Слишком много запросов на экспорт. Повторите через несколько минут.' },
})
