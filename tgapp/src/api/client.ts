import axios from 'axios'

export class TelegramAuthorizationError extends Error {
  constructor() {
    super('Откройте приложение внутри Telegram, чтобы загрузить данные.')
    this.name = 'TelegramAuthorizationError'
  }
}

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, '')

export const api = axios.create({
  baseURL: configuredApiUrl || (import.meta.env.DEV ? 'http://127.0.0.1:3000/api' : '/api'),
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const telegramInitData = window.Telegram?.WebApp?.initData?.trim()
  const developmentInitData = import.meta.env.DEV
    ? import.meta.env.VITE_DEV_TELEGRAM_INIT_DATA?.trim()
    : undefined
  const initData = telegramInitData || developmentInitData

  if (!initData) {
    throw new TelegramAuthorizationError()
  }

  config.headers.Authorization = `tma ${initData}`
  return config
})

export function getApiErrorMessage(error: unknown) {
  if (error instanceof TelegramAuthorizationError) return error.message

  if (axios.isAxiosError<{ message?: string }>(error)) {
    if (error.response?.status === 401) {
      return 'Сессия Telegram устарела. Закройте и заново откройте Mini App.'
    }

    return error.response?.data?.message || 'Не удалось связаться с сервером.'
  }

  return 'Произошла неизвестная ошибка.'
}
