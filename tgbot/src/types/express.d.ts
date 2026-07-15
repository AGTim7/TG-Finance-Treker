declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        telegramId: string
        username?: string
      }
    }
  }
}

export {}
