const getStartMessage = (name?: string) => `👋 Здравствуйте${name ? `, ${name}` : ''}! Добро пожаловать в FinanceTrackerBot!

Бот поможет учитывать доходы и расходы прямо в Telegram.

Доступные способы добавить транзакцию:
• Доход — команда /income
• Расход — команда /expense
• Mini App — для добавления транзакций и просмотра истории`

export default getStartMessage
