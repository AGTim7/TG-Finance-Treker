import type { Server } from 'node:http'

import app from './app'
import bot, { startBot } from './bot/index'
import { env } from './config/env'
import { prisma } from './prisma/client'

let server: Server | undefined
let botTask: Promise<void> | undefined
let shuttingDown = false

async function closeServer() {
  if (!server) return

  await new Promise<void>((resolve, reject) => {
    server!.close((error) => {
      if (error && (error as NodeJS.ErrnoException).code !== 'ERR_SERVER_NOT_RUNNING') {
        reject(error)
        return
      }
      resolve()
    })
  })
}

async function shutdown(reason: string, exitCode: number) {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`Shutting down: ${reason}`)

  try {
    if (bot.isRunning()) {
      await bot.stop()
      await botTask?.catch(() => undefined)
    }
    await closeServer()
    await prisma.$disconnect()
  } catch (error) {
    console.error('Graceful shutdown failed:', error)
    exitCode = 1
  } finally {
    process.exit(exitCode)
  }
}

if (env.PROCESS_ROLE !== 'bot') {
  server = app.listen(env.API_PORT, () => {
    console.log(`API started on port ${env.API_PORT}`)
  })

  server.on('error', (error) => {
    console.error('API server failed:', error)
    void shutdown('API server error', 1)
  })
}

if (env.PROCESS_ROLE !== 'api' && env.TELEGRAM_UPDATE_MODE === 'polling') {
  botTask = startBot()
  void botTask.catch((error) => {
    console.error('Bot failed:', error)
    void shutdown('Bot startup error', 1)
  })
}

process.once('SIGINT', () => void shutdown('SIGINT', 0))
process.once('SIGTERM', () => void shutdown('SIGTERM', 0))
process.once('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
  void shutdown('uncaught exception', 1)
})
process.once('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error)
  void shutdown('unhandled rejection', 1)
})
