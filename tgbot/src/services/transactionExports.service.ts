import { InputFile } from 'grammy'
import { randomUUID } from 'node:crypto'
import { rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { prisma } from '../prisma/client'
import bot from '../bot/index'
import type { TransactionExportInput } from '../api/validation/exports.validation'
import {
  TransactionReportBuilder,
  type ReportTransaction,
} from './exports/transactionReport'

const EXPORT_LIMIT = 10_000
const QUERY_BATCH_SIZE = 500
const TELEGRAM_DOCUMENT_LIMIT_BYTES = 49 * 1024 * 1024

export class TransactionExportError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message)
    this.name = 'TransactionExportError'
  }
}

export class TransactionExportService {
  static async sendToTelegram(
    user: { id: string; telegramId: string },
    input: TransactionExportInput,
  ) {
    const where = {
      userId: user.id,
      ...((input.from || input.to) && {
        date: {
          ...(input.from && { gte: input.from }),
          ...(input.to && { lt: input.to }),
        },
      }),
    }

    const [transactionCount, profile] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.user.findUnique({ where: { id: user.id }, select: { currency: true } }),
    ])

    if (!profile) throw new TransactionExportError('Пользователь не найден', 404)
    if (transactionCount > EXPORT_LIMIT) {
      throw new TransactionExportError(
        `За период найдено больше ${EXPORT_LIMIT.toLocaleString('ru-RU')} транзакций. Выберите меньший период.`,
        422,
      )
    }

    const builder = new TransactionReportBuilder({
      outputPath: join(tmpdir(), `finance-report-${randomUUID()}.xlsx`),
      currency: profile.currency,
      from: input.from,
      to: input.to,
      timezoneOffsetMinutes: input.timezoneOffsetMinutes,
    })

    try {
      let cursor: string | undefined
      let processed = 0
      while (processed < transactionCount) {
        const items = await prisma.transaction.findMany({
          where,
          orderBy: [{ date: 'asc' }, { id: 'asc' }],
          take: QUERY_BATCH_SIZE,
          ...(cursor && { cursor: { id: cursor }, skip: 1 }),
          select: {
            id: true,
            type: true,
            amount: true,
            description: true,
            date: true,
            category: { select: { id: true, name: true, emoji: true, color: true } },
            wallet: { select: { name: true, emoji: true } },
          },
        })
        if (items.length === 0) break

        builder.addTransactions(items.map((item): ReportTransaction => ({
          ...item,
          amount: item.amount.toFixed(2),
        })))
        processed += items.length
        cursor = items.at(-1)!.id
      }

      const report = await builder.finalize()
      const file = await stat(report.path)
      if (file.size > TELEGRAM_DOCUMENT_LIMIT_BYTES) {
        throw new TransactionExportError('Получившийся файл слишком большой. Выберите меньший период.', 422)
      }

      try {
        await bot.api.sendDocument(
          user.telegramId,
          new InputFile(report.path, report.filename),
          {
            caption: [
              'Финансовый отчёт готов',
              `Период: ${report.periodLabel}`,
              `Транзакций: ${report.transactionCount.toLocaleString('ru-RU')}`,
            ].join('\n'),
          },
        )
      } catch (error) {
        console.error('Failed to send transaction export to Telegram:', error)
        throw new TransactionExportError(
          'Не удалось отправить файл. Убедитесь, что чат с ботом не заблокирован, и повторите попытку.',
          502,
        )
      }

      return {
        sent: true as const,
        filename: report.filename,
        transactionCount: report.transactionCount,
        period: report.periodLabel,
      }
    } finally {
      await rm(builder.outputPath, { force: true })
      await rm(`${builder.outputPath}.base`, { force: true })
    }
  }
}
