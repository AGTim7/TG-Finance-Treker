import { ApiError } from '../errors/apiError'
import { parseDateRange } from './transactions.validation'

export type TransactionExportInput = {
  from?: Date
  to?: Date
  timezoneOffsetMinutes: number
}

export function parseTransactionExportBody(body: unknown): TransactionExportInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'Request body must be an object')
  }

  const value = body as Record<string, unknown>
  const allowedFields = new Set(['from', 'to', 'timezoneOffsetMinutes'])
  if (Object.keys(value).some((field) => !allowedFields.has(field))) {
    throw new ApiError(400, 'Request body contains unsupported fields')
  }

  const { from, to } = parseDateRange(value.from, value.to)
  if ((from && !to) || (!from && to)) {
    throw new ApiError(400, 'from and to must be provided together')
  }

  const timezoneOffsetMinutes = value.timezoneOffsetMinutes
  if (
    typeof timezoneOffsetMinutes !== 'number'
    || !Number.isInteger(timezoneOffsetMinutes)
    || timezoneOffsetMinutes < -840
    || timezoneOffsetMinutes > 840
  ) {
    throw new ApiError(400, 'timezoneOffsetMinutes must be an integer between -840 and 840')
  }

  return { from, to, timezoneOffsetMinutes }
}
