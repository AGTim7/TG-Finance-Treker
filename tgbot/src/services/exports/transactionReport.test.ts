import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import ExcelJS from 'exceljs'
import JSZip from 'jszip'

import { TransactionReportBuilder, type ReportTransaction } from './transactionReport'

function transaction(
  id: string,
  type: ReportTransaction['type'],
  amount: string,
  date: string,
  category: { id: string; name: string; emoji: string; color: string },
): ReportTransaction {
  return {
    id,
    type,
    amount,
    date: new Date(date),
    description: type === 'EXPENSE' ? 'Тестовая покупка' : 'Тестовый доход',
    category,
    wallet: { name: 'Банковская карта', emoji: '💳' },
  }
}

async function loadReport(items: ReportTransaction[], from: string, to: string) {
  const builder = new TransactionReportBuilder({
    outputPath: join(tmpdir(), `finance-report-test-${randomUUID()}.xlsx`),
    currency: 'RUB',
    from: new Date(from),
    to: new Date(to),
    timezoneOffsetMinutes: 0,
    generatedAt: new Date('2026-07-19T10:00:00.000Z'),
  })
  builder.addTransactions(items)
  const report = await builder.finalize()
  const content = await readFile(report.path)
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(content as unknown as ExcelJS.Buffer)
  await rm(report.path, { force: true })
  return { report, content, workbook }
}

test('transaction report creates summary, filtered transactions and category analysis', async () => {
  const food = { id: 'food', name: 'Продукты', emoji: '🛒', color: '#F59E0B' }
  const salary = { id: 'salary', name: 'Зарплата', emoji: '💼', color: '#10B981' }
  const { report, content, workbook } = await loadReport([
    transaction('one', 'INCOME', '10000.00', '2026-07-02T10:00:00.000Z', salary),
    transaction('two', 'EXPENSE', '1250.50', '2026-07-03T12:00:00.000Z', food),
  ], '2026-07-01T00:00:00.000Z', '2026-08-01T00:00:00.000Z')

  assert.equal(content.subarray(0, 2).toString(), 'PK')
  const zip = await JSZip.loadAsync(content)
  const workbookXml = await zip.file('xl/workbook.xml')!.async('string')
  assert.doesNotMatch(workbookXml, /NaN/)
  assert.equal(report.transactionCount, 2)
  assert.deepEqual(workbook.worksheets.map((sheet) => sheet.name), [
    'Сводка', 'Все транзакции', 'Категории',
  ])
  assert.equal(workbook.getWorksheet('Сводка')?.getCell('A6').value, 10000)
  assert.equal(workbook.getWorksheet('Сводка')?.getCell('C6').value, 1250.5)
  assert.equal(workbook.getWorksheet('Сводка')?.getImages().length, 1)
  assert.equal(workbook.getWorksheet('Все транзакции')?.getCell('D6').value, '💼 Зарплата')
  assert.ok(workbook.getWorksheet('Все транзакции')?.autoFilter)
  assert.ok(workbook.getWorksheet('Категории')?.autoFilter)
})

test('transaction report adds monthly sheet only for a multi-month period', async () => {
  const food = { id: 'food', name: 'Продукты', emoji: '🛒', color: '#F59E0B' }
  const { workbook } = await loadReport([
    transaction('one', 'EXPENSE', '500.00', '2026-06-15T10:00:00.000Z', food),
    transaction('two', 'EXPENSE', '700.00', '2026-07-15T10:00:00.000Z', food),
  ], '2026-06-01T00:00:00.000Z', '2026-08-01T00:00:00.000Z')

  const monthly = workbook.getWorksheet('По месяцам')
  assert.ok(monthly)
  assert.equal(monthly.getCell('A6').value, 'Июнь 2026')
  assert.equal(monthly.getCell('C6').value, 500)
  assert.equal(monthly.getCell('A7').value, 'Июль 2026')
  assert.equal(monthly.getCell('C7').value, 700)
  assert.equal(monthly.getImages().length, 1)
})
