// prisma/seed.ts
import { TransactionType } from '../generated/prisma/enums';
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const GLOBAL_CATEGORIES = [
  // 🔴 РАСХОДЫ (EXPENSE)
  { name: 'Продукты', type: TransactionType.EXPENSE, emoji: '🍏', color: '#4CD964' },
  { name: 'Кафе и рестораны', type: TransactionType.EXPENSE, emoji: '🍔', color: '#FF9500' },
  { name: 'Транспорт и такси', type: TransactionType.EXPENSE, emoji: '🚕', color: '#FFCC00' },
  { name: 'Жилье и ЖКХ', type: TransactionType.EXPENSE, emoji: '🏠', color: '#5AC8FA' },
  { name: 'Одежда и покупки', type: TransactionType.EXPENSE, emoji: '👕', color: '#007AFF' },
  { name: 'Здоровье и аптека', type: TransactionType.EXPENSE, emoji: '💊', color: '#FF3B30' },
  { name: 'Развлечения и отдых', type: TransactionType.EXPENSE, emoji: '🍿', color: '#5856D6' },
  { name: 'Подарки', type: TransactionType.EXPENSE, emoji: '🎁', color: '#FF2D55' },
  { name: 'Другое', type: TransactionType.EXPENSE, emoji: '🏷️', color: '#8E8E93' },

  // 🟢 ДОХОДЫ (INCOME)
  { name: 'Зарплата', type: TransactionType.INCOME, emoji: '💰', color: '#28C76F' },
  { name: 'Фриланс и подработка', type: TransactionType.INCOME, emoji: '💻', color: '#00CFDD' },
  { name: 'Подарки и переводы', type: TransactionType.INCOME, emoji: '🍀', color: '#EA5455' },
  { name: 'Инвестиции', type: TransactionType.INCOME, emoji: '📈', color: '#7367F0' },
  { name: 'Прочие доходы', type: TransactionType.INCOME, emoji: '💵', color: '#32CB82' }
];

async function main() {
  console.log('Добавляем базовые категории...');


  for (const category of GLOBAL_CATEGORIES) {
    await prisma.category.create({
      data: {
        name: category.name,
        type: category.type,
        emoji: category.emoji,
        color: category.color,
        userId: null
      }
    });
  }

  console.log(`База успешно заполнена! Создано ${GLOBAL_CATEGORIES.length} категорий.`);
}

main()
  .catch((e) => {
    console.error('Ошибка: ', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });