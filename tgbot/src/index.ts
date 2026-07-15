import app from './app'
import bot from './bot/index'

const port = Number(process.env.API_PORT ?? 3000)

app.listen(port, () => {
  console.log(`API started on port ${port}`)
})

bot.start()
console.log('Bot started')
