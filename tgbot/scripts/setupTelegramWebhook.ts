import 'dotenv/config'

import bot, { configureBotCommands } from '../src/bot/index'
import { env } from '../src/config/env'

async function main() {
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL?.trim()
  const miniAppUrl = process.env.TELEGRAM_MINI_APP_URL?.trim()

  if (!webhookUrl || !webhookUrl.startsWith('https://')) {
    throw new Error('TELEGRAM_WEBHOOK_URL must be a public HTTPS URL')
  }

  if (!miniAppUrl || !miniAppUrl.startsWith('https://')) {
    throw new Error('TELEGRAM_MINI_APP_URL must be a public HTTPS URL')
  }

  if (!env.TELEGRAM_WEBHOOK_SECRET) {
    throw new Error('TELEGRAM_WEBHOOK_SECRET is not configured')
  }

  await configureBotCommands()
  await bot.api.setChatMenuButton({
    menu_button: {
      type: 'web_app',
      text: 'Открыть FinanceTracker',
      web_app: { url: miniAppUrl },
    },
  })
  await bot.api.setWebhook(webhookUrl, {
    secret_token: env.TELEGRAM_WEBHOOK_SECRET,
    max_connections: 1,
  })

  const webhook = await bot.api.getWebhookInfo()
  const menuButton = await bot.api.getChatMenuButton()
  console.log(`Telegram webhook configured: ${webhook.url}`)
  console.log(`Telegram menu button configured: ${menuButton.type}`)
}

void main().catch((error) => {
  console.error('Failed to configure Telegram webhook:', error)
  process.exitCode = 1
})
