import ExcelJS, {
  type Cell,
  type Fill,
  type Font,
  type Row,
  type Worksheet,
} from 'exceljs'
import { rm } from 'node:fs/promises'

import { createDonutChartPng, createMonthlyBarsPng } from './chartImages'
import { embedWorksheetImages, type WorksheetImage } from './xlsxImages'

export type ReportTransaction = {
  id: string
  type: 'INCOME' | 'EXPENSE'
  amount: string
  description: string | null
  date: Date
  category: { id: string; name: string; emoji: string; color: string }
  wallet: { name: string; emoji: string }
}

export type TransactionReportOptions = {
  outputPath: string
  currency: string
  from?: Date
  to?: Date
  timezoneOffsetMinutes: number
  generatedAt?: Date
}

type CategoryAggregate = {
  id: string
  name: string
  emoji: string
  color: string
  type: ReportTransaction['type']
  amountCents: bigint
  transactionCount: number
}

type MonthAggregate = {
  key: string
  label: string
  incomeCents: bigint
  expenseCents: bigint
}

type ReportResult = {
  path: string
  filename: string
  transactionCount: number
  periodLabel: string
}

const COLORS = {
  navy: 'FF17324D',
  blue: 'FF2575FC',
  green: 'FF10B981',
  red: 'FFF46368',
  amber: 'FFF59E0B',
  text: 'FF243447',
  muted: 'FF6B7B8C',
  light: 'FFF4F7FA',
  border: 'FFDCE4EC',
  white: 'FFFFFFFF',
}

const MONEY_FORMAT = '#,##0.00;[Red]-#,##0.00;–'
const BODY_FONT: Partial<Font> = { name: 'Aptos', size: 10, color: { argb: COLORS.text } }
const LIGHT_FILL: Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.light } }

function amountToCents(value: string) {
  const [whole, fraction = ''] = value.split('.')
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0').slice(0, 2))
}

function centsToNumber(value: bigint) {
  return Number(value) / 100
}

function toLocalWallTime(value: Date, timezoneOffsetMinutes: number) {
  return new Date(value.getTime() - timezoneOffsetMinutes * 60_000)
}

function pad(value: number) {
  return value.toString().padStart(2, '0')
}

function formatDate(value: Date) {
  return `${pad(value.getUTCDate())}.${pad(value.getUTCMonth() + 1)}.${value.getUTCFullYear()}`
}

function monthKey(value: Date) {
  return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}`
}

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

function monthLabel(value: Date) {
  return `${MONTHS[value.getUTCMonth()]} ${value.getUTCFullYear()}`
}

function applyRangeStyle(
  sheet: Worksheet,
  fromRow: number,
  toRow: number,
  fromColumn: number,
  toColumn: number,
  apply: (cell: Cell) => void,
) {
  for (let row = fromRow; row <= toRow; row += 1) {
    for (let column = fromColumn; column <= toColumn; column += 1) {
      apply(sheet.getCell(row, column))
    }
  }
}

function styleTitle(sheet: Worksheet, title: string, lastColumn: string) {
  sheet.mergeCells(`A1:${lastColumn}2`)
  const cell = sheet.getCell('A1')
  cell.value = title
  cell.font = { name: 'Aptos Display', size: 20, bold: true, color: { argb: COLORS.white } }
  cell.alignment = { vertical: 'middle', horizontal: 'left' }
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navy } }
  applyRangeStyle(sheet, 1, 2, 1, sheet.getColumn(lastColumn).number, (target) => {
    target.fill = cell.fill
  })
  sheet.getRow(1).height = 28
  sheet.getRow(2).height = 14
}

function styleSectionHeader(sheet: Worksheet, row: number, fromColumn: number, toColumn: number) {
  applyRangeStyle(sheet, row, row, fromColumn, toColumn, (cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navy } }
    cell.font = { name: 'Aptos', size: 10, bold: true, color: { argb: COLORS.white } }
    cell.alignment = { vertical: 'middle', horizontal: 'left' }
  })
  sheet.getRow(row).height = 23
}

function styleTableHeader(row: Row) {
  row.height = 24
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navy } }
    cell.font = { name: 'Aptos', size: 10, bold: true, color: { argb: COLORS.white } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  })
}

function setSheetDefaults(sheet: Worksheet) {
  sheet.properties.defaultRowHeight = 19
  sheet.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
  }
  sheet.headerFooter.oddFooter = '&LFinanceTrackerBot&CСтраница &P из &N&R&D'
}

function calendarDays(from: Date, to: Date) {
  const fromDay = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
  const toDay = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate())
  return Math.max(1, Math.floor((toDay - fromDay) / 86_400_000) + 1)
}

export class TransactionReportBuilder {
  private readonly workbook: ExcelJS.stream.xlsx.WorkbookWriter
  private readonly transactionsSheet: Worksheet
  private readonly categories = new Map<string, CategoryAggregate>()
  private readonly months = new Map<string, MonthAggregate>()
  private transactionCount = 0
  private incomeCents = 0n
  private expenseCents = 0n
  private earliestDate?: Date
  private latestDate?: Date
  private largestExpense?: { amountCents: bigint; label: string }

  readonly outputPath: string

  constructor(private readonly options: TransactionReportOptions) {
    this.outputPath = options.outputPath
    this.workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      filename: `${options.outputPath}.base`,
      useStyles: true,
      useSharedStrings: false,
      zip: { zlib: { level: 6 } },
    })
    this.workbook.creator = 'FinanceTrackerBot'
    this.workbook.company = 'FinanceTrackerBot'
    this.workbook.subject = 'Отчёт по личным финансам'
    this.workbook.title = 'Отчёт по транзакциям'
    this.workbook.created = options.generatedAt ?? new Date()
    this.workbook.modified = options.generatedAt ?? new Date()
    const summarySheet = this.workbook.addWorksheet('Сводка', {
      properties: { tabColor: { argb: COLORS.blue } },
      views: [{ state: 'normal', showGridLines: false }],
    })
    this.transactionsSheet = this.workbook.addWorksheet('Все транзакции', {
      properties: { tabColor: { argb: COLORS.navy } },
      views: [{ state: 'frozen', xSplit: 1, ySplit: 5, topLeftCell: 'B6', activeCell: 'B6', showGridLines: false }],
    })
    this.workbook.addWorksheet('Категории', {
      properties: { tabColor: { argb: COLORS.amber } },
      views: [{ state: 'frozen', ySplit: 5, topLeftCell: 'A6', activeCell: 'A6', showGridLines: false }],
    })
    setSheetDefaults(summarySheet)
    setSheetDefaults(this.transactionsSheet)
    setSheetDefaults(this.workbook.getWorksheet('Категории')!)
    this.prepareTransactionsSheet(this.requestedPeriodLabel())
  }

  private requestedPeriodLabel() {
    if (!this.options.from || !this.options.to) return 'Все время'
    const from = toLocalWallTime(this.options.from, this.options.timezoneOffsetMinutes)
    const to = toLocalWallTime(new Date(this.options.to.getTime() - 1), this.options.timezoneOffsetMinutes)
    return `${formatDate(from)} — ${formatDate(to)}`
  }

  private prepareTransactionsSheet(periodLabel: string) {
    const sheet = this.transactionsSheet
    styleTitle(sheet, 'Все транзакции', 'I')
    sheet.mergeCells('A3:I3')
    sheet.getCell('A3').value = `Период: ${periodLabel}. Фильтры доступны в заголовках.`
    sheet.getCell('A3').font = { ...BODY_FONT, color: { argb: COLORS.muted }, italic: true }
    sheet.getCell('A3').alignment = { vertical: 'middle', horizontal: 'left' }
    sheet.getRow(3).height = 22

    sheet.getRow(5).values = ['№', 'Дата', 'Тип', 'Категория', 'Описание', 'Кошелёк', 'Сумма', 'Валюта', 'ID']
    styleTableHeader(sheet.getRow(5))
    sheet.columns = [
      { key: 'number', width: 7 },
      { key: 'date', width: 20 },
      { key: 'type', width: 12 },
      { key: 'category', width: 24 },
      { key: 'description', width: 38 },
      { key: 'wallet', width: 22 },
      { key: 'amount', width: 18 },
      { key: 'currency', width: 11 },
      { key: 'id', width: 38 },
    ]
    sheet.getColumn(9).hidden = true
    sheet.getColumn(2).numFmt = 'dd.mm.yyyy hh:mm'
    sheet.getColumn(7).numFmt = MONEY_FORMAT
  }

  addTransactions(items: ReportTransaction[]) {
    items.forEach((item) => this.addTransaction(item))
  }

  private addTransaction(item: ReportTransaction) {
    this.transactionCount += 1
    const amountCents = amountToCents(item.amount)
    const localDate = toLocalWallTime(item.date, this.options.timezoneOffsetMinutes)
    const signedAmount = item.type === 'EXPENSE' ? -amountCents : amountCents
    const row = this.transactionsSheet.addRow([
      this.transactionCount,
      localDate,
      item.type === 'EXPENSE' ? 'Расход' : 'Доход',
      `${item.category.emoji} ${item.category.name}`.trim(),
      item.description || '—',
      `${item.wallet.emoji} ${item.wallet.name}`.trim(),
      centsToNumber(signedAmount),
      this.options.currency,
      item.id,
    ])
    row.height = 20
    row.font = BODY_FONT
    row.alignment = { vertical: 'middle' }
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(7).alignment = { horizontal: 'right', vertical: 'middle' }
    row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(7).font = {
      ...BODY_FONT,
      bold: true,
      color: { argb: item.type === 'EXPENSE' ? COLORS.red : COLORS.green },
    }
    row.commit()

    if (!this.earliestDate || item.date < this.earliestDate) this.earliestDate = item.date
    if (!this.latestDate || item.date > this.latestDate) this.latestDate = item.date
    if (item.type === 'EXPENSE') {
      this.expenseCents += amountCents
      if (!this.largestExpense || amountCents > this.largestExpense.amountCents) {
        this.largestExpense = {
          amountCents,
          label: item.description || `${item.category.emoji} ${item.category.name}`.trim(),
        }
      }
    } else {
      this.incomeCents += amountCents
    }

    const categoryKey = `${item.type}:${item.category.id}`
    const category = this.categories.get(categoryKey) ?? {
      id: item.category.id,
      name: item.category.name,
      emoji: item.category.emoji,
      color: item.category.color,
      type: item.type,
      amountCents: 0n,
      transactionCount: 0,
    }
    category.amountCents += amountCents
    category.transactionCount += 1
    this.categories.set(categoryKey, category)

    const key = monthKey(localDate)
    const month = this.months.get(key) ?? {
      key,
      label: monthLabel(localDate),
      incomeCents: 0n,
      expenseCents: 0n,
    }
    if (item.type === 'EXPENSE') month.expenseCents += amountCents
    else month.incomeCents += amountCents
    this.months.set(key, month)
  }

  private resolveReportRange() {
    const from = this.options.from
      ? toLocalWallTime(this.options.from, this.options.timezoneOffsetMinutes)
      : this.earliestDate
        ? toLocalWallTime(this.earliestDate, this.options.timezoneOffsetMinutes)
        : undefined
    const to = this.options.to
      ? toLocalWallTime(new Date(this.options.to.getTime() - 1), this.options.timezoneOffsetMinutes)
      : this.latestDate
        ? toLocalWallTime(this.latestDate, this.options.timezoneOffsetMinutes)
        : undefined

    return {
      from,
      to,
      label: this.requestedPeriodLabel(),
      days: from && to ? calendarDays(from, to) : 1,
      isMultiMonth: Boolean(from && to && monthKey(from) !== monthKey(to)),
    }
  }

  private finishTransactionsSheet() {
    const sheet = this.transactionsSheet
    const lastRow = Math.max(5, this.transactionCount + 5)
    sheet.autoFilter = `A5:I${lastRow}`
    if (this.transactionCount === 0) {
      sheet.mergeCells('A6:I8')
      sheet.getCell('A6').value = 'За выбранный период транзакций нет'
      sheet.getCell('A6').font = { ...BODY_FONT, color: { argb: COLORS.muted }, italic: true }
      sheet.getCell('A6').alignment = { horizontal: 'center', vertical: 'middle' }
    }
    sheet.pageSetup.printTitlesRow = '1:5'
    sheet.pageSetup.printArea = `A1:H${Math.max(8, lastRow)}`
    sheet.commit()
  }

  private buildSummarySheet(periodLabel: string, days: number) {
    const sheet = this.workbook.getWorksheet('Сводка')!
    styleTitle(sheet, 'Финансовый отчёт', 'H')
    sheet.columns = Array.from({ length: 8 }, () => ({ width: 16 }))
    sheet.mergeCells('A3:H3')
    sheet.getCell('A3').value = `Период: ${periodLabel}  •  Сформировано: ${formatDate(toLocalWallTime(this.options.generatedAt ?? new Date(), this.options.timezoneOffsetMinutes))}`
    sheet.getCell('A3').font = { ...BODY_FONT, color: { argb: COLORS.muted } }
    sheet.getCell('A3').alignment = { vertical: 'middle', horizontal: 'left' }
    sheet.getRow(3).height = 22

    const cards = [
      { range: 'A5:B7', label: 'ОБЩИЙ ДОХОД', value: centsToNumber(this.incomeCents), color: COLORS.green, money: true },
      { range: 'C5:D7', label: 'ОБЩИЙ РАСХОД', value: centsToNumber(this.expenseCents), color: COLORS.red, money: true },
      { range: 'E5:F7', label: 'БАЛАНС', value: centsToNumber(this.incomeCents - this.expenseCents), color: COLORS.blue, money: true },
      { range: 'G5:H7', label: 'ТРАНЗАКЦИИ', value: this.transactionCount, color: COLORS.navy, money: false },
    ]
    cards.forEach(({ range, label, value, color, money }) => {
      const [start, end] = range.split(':')
      const startCell = sheet.getCell(start)
      const endCell = sheet.getCell(end)
      const labelRow = startCell.fullAddress.row
      const valueFromRow = labelRow + 1
      const startColumn = startCell.fullAddress.col
      const endColumn = endCell.fullAddress.col
      sheet.mergeCells(labelRow, startColumn, labelRow, endColumn)
      sheet.mergeCells(valueFromRow, startColumn, endCell.fullAddress.row, endColumn)
      const labelCell = sheet.getCell(labelRow, startColumn)
      labelCell.value = label
      labelCell.font = { name: 'Aptos', size: 9, bold: true, color: { argb: COLORS.muted } }
      labelCell.alignment = { vertical: 'middle', horizontal: 'left' }
      const valueCell = sheet.getCell(valueFromRow, startColumn)
      valueCell.value = value
      valueCell.numFmt = money ? `${MONEY_FORMAT} "${this.options.currency}"` : '#,##0'
      valueCell.font = { name: 'Aptos Display', size: 17, bold: true, color: { argb: color } }
      valueCell.alignment = { vertical: 'middle', horizontal: 'left' }
      applyRangeStyle(sheet, labelRow, endCell.fullAddress.row, startColumn, endColumn, (cell) => {
        cell.fill = LIGHT_FILL
        cell.border = {
          top: { style: 'thin', color: { argb: COLORS.border } },
          bottom: { style: 'thin', color: { argb: COLORS.border } },
          left: { style: 'thin', color: { argb: COLORS.border } },
          right: { style: 'thin', color: { argb: COLORS.border } },
        }
      })
    })

    const expenseCategories = [...this.categories.values()]
      .filter((category) => category.type === 'EXPENSE')
      .sort((left, right) => Number(right.amountCents - left.amountCents))
    const topCategory = expenseCategories[0]
    const averageExpense = this.expenseCents / BigInt(Math.max(1, days))
    const details = [
      { columns: [1, 2], label: 'СРЕДНИЙ РАСХОД В ДЕНЬ', value: centsToNumber(averageExpense), money: true },
      { columns: [3, 5], label: 'САМАЯ ДОРОГАЯ КАТЕГОРИЯ', value: topCategory ? `${topCategory.emoji} ${topCategory.name}`.trim() : '—', money: false },
      { columns: [6, 8], label: 'САМАЯ КРУПНАЯ ПОКУПКА', value: this.largestExpense ? `${this.largestExpense.label} · ${centsToNumber(this.largestExpense.amountCents).toLocaleString('ru-RU')} ${this.options.currency}` : '—', money: false },
    ]
    details.forEach(({ columns, label, value, money }) => {
      sheet.mergeCells(9, columns[0], 9, columns[1])
      sheet.mergeCells(10, columns[0], 11, columns[1])
      sheet.getCell(9, columns[0]).value = label
      sheet.getCell(9, columns[0]).font = { name: 'Aptos', size: 9, bold: true, color: { argb: COLORS.muted } }
      sheet.getCell(10, columns[0]).value = value
      sheet.getCell(10, columns[0]).font = { name: 'Aptos', size: money ? 15 : 11, bold: true, color: { argb: COLORS.text } }
      sheet.getCell(10, columns[0]).numFmt = money ? `${MONEY_FORMAT} "${this.options.currency}"` : '@'
      sheet.getCell(10, columns[0]).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
      applyRangeStyle(sheet, 9, 11, columns[0], columns[1], (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.white } }
        cell.border = { bottom: { style: 'thin', color: { argb: COLORS.border } } }
      })
    })

    sheet.mergeCells('A13:H13')
    sheet.getCell('A13').value = 'СТРУКТУРА РАСХОДОВ'
    styleSectionHeader(sheet, 13, 1, 8)
    const chartCategories = expenseCategories.slice(0, 6)
    const chartTotal = chartCategories.reduce((total, category) => total + category.amountCents, 0n)
    sheet.getRow(15).values = ['Категория', '', 'Сумма', 'Доля']
    sheet.mergeCells('A15:B15')
    styleTableHeader(sheet.getRow(15))
    chartCategories.forEach((category, index) => {
      const rowNumber = 16 + index
      sheet.mergeCells(rowNumber, 1, rowNumber, 2)
      sheet.getCell(rowNumber, 1).value = `${category.emoji} ${category.name}`.trim()
      sheet.getCell(rowNumber, 3).value = centsToNumber(category.amountCents)
      sheet.getCell(rowNumber, 3).numFmt = `${MONEY_FORMAT} "${this.options.currency}"`
      sheet.getCell(rowNumber, 4).value = chartTotal === 0n ? 0 : Number(category.amountCents * 10_000n / chartTotal) / 10_000
      sheet.getCell(rowNumber, 4).numFmt = '0.0%'
      applyRangeStyle(sheet, rowNumber, rowNumber, 1, 4, (cell) => {
        cell.font = BODY_FONT
        cell.border = { bottom: { style: 'thin', color: { argb: COLORS.border } } }
      })
    })
    if (chartCategories.length === 0) {
      sheet.mergeCells('A16:D19')
      sheet.getCell('A16').value = 'Расходов за выбранный период нет'
      sheet.getCell('A16').font = { ...BODY_FONT, color: { argb: COLORS.muted }, italic: true }
      sheet.getCell('A16').alignment = { vertical: 'middle', horizontal: 'center' }
    }

    const donut = createDonutChartPng(chartCategories.map((category) => ({
      amount: centsToNumber(category.amountCents),
      color: category.color,
    })))
    sheet.getCell('E24').value = chartCategories.length > 0 ? 'Распределение топ-категорий расходов' : 'Нет данных'
    sheet.getCell('E24').font = { ...BODY_FONT, size: 9, color: { argb: COLORS.muted }, italic: true }
    sheet.mergeCells('E24:H24')
    sheet.getCell('E24').alignment = { horizontal: 'center' }
    sheet.pageSetup.printArea = 'A1:H25'
    sheet.commit()
    return donut
  }

  private buildCategoriesSheet(periodLabel: string) {
    const sheet = this.workbook.getWorksheet('Категории')!
    styleTitle(sheet, 'Категории', 'F')
    sheet.mergeCells('A3:F3')
    sheet.getCell('A3').value = `Период: ${periodLabel}. Операции каждой категории доступны через фильтр «Категория» на листе «Все транзакции».`
    sheet.getCell('A3').font = { ...BODY_FONT, color: { argb: COLORS.muted }, italic: true }
    sheet.getCell('A3').alignment = { vertical: 'middle', horizontal: 'left' }
    sheet.getRow(3).height = 24
    sheet.getRow(5).values = ['Категория', 'Тип', 'Сумма', 'Операций', 'Средняя операция', 'Доля в типе']
    styleTableHeader(sheet.getRow(5))
    sheet.columns = [
      { width: 28 }, { width: 14 }, { width: 19 }, { width: 13 }, { width: 20 }, { width: 15 },
    ]

    const rows = [...this.categories.values()].sort((left, right) => {
      if (left.type !== right.type) return left.type === 'EXPENSE' ? -1 : 1
      return Number(right.amountCents - left.amountCents)
    })
    rows.forEach((category, index) => {
      const typeTotal = category.type === 'EXPENSE' ? this.expenseCents : this.incomeCents
      const row = sheet.addRow([
        `${category.emoji} ${category.name}`.trim(),
        category.type === 'EXPENSE' ? 'Расход' : 'Доход',
        centsToNumber(category.amountCents),
        category.transactionCount,
        centsToNumber(category.amountCents) / category.transactionCount,
        typeTotal === 0n ? 0 : Number(category.amountCents * 10_000n / typeTotal) / 10_000,
      ])
      row.font = BODY_FONT
      row.height = 21
      row.getCell(2).alignment = { horizontal: 'center' }
      row.getCell(3).numFmt = `${MONEY_FORMAT} "${this.options.currency}"`
      row.getCell(4).numFmt = '#,##0'
      row.getCell(5).numFmt = `${MONEY_FORMAT} "${this.options.currency}"`
      row.getCell(6).numFmt = '0.0%'
      if (index % 2 === 1) row.fill = LIGHT_FILL
    })
    if (rows.length === 0) {
      sheet.mergeCells('A6:F8')
      sheet.getCell('A6').value = 'За выбранный период транзакций нет'
      sheet.getCell('A6').font = { ...BODY_FONT, color: { argb: COLORS.muted }, italic: true }
      sheet.getCell('A6').alignment = { horizontal: 'center', vertical: 'middle' }
    }
    const lastRow = Math.max(5, 5 + rows.length)
    sheet.autoFilter = `A5:F${lastRow}`
    sheet.pageSetup.printTitlesRow = '1:5'
    sheet.pageSetup.printArea = `A1:F${Math.max(8, lastRow)}`
    sheet.commit()
  }

  private buildMonthlySheet(periodLabel: string) {
    const sheet = this.workbook.addWorksheet('По месяцам', {
      properties: { tabColor: { argb: COLORS.green } },
      views: [{ state: 'frozen', ySplit: 5, topLeftCell: 'A6', activeCell: 'A6', showGridLines: false }],
    })
    setSheetDefaults(sheet)
    styleTitle(sheet, 'Динамика по месяцам', 'N')
    sheet.mergeCells('A3:N3')
    sheet.getCell('A3').value = `Период: ${periodLabel}`
    sheet.getCell('A3').font = { ...BODY_FONT, color: { argb: COLORS.muted } }
    sheet.getRow(5).values = ['Месяц', 'Доходы', 'Расходы', 'Баланс']
    styleTableHeader(sheet.getRow(5))
    sheet.columns = [
      { width: 22 }, { width: 19 }, { width: 19 }, { width: 19 },
      ...Array.from({ length: 10 }, () => ({ width: 12 })),
    ]
    const months = [...this.months.values()].sort((left, right) => left.key.localeCompare(right.key))
    months.forEach((month, index) => {
      const row = sheet.addRow([
        month.label,
        centsToNumber(month.incomeCents),
        centsToNumber(month.expenseCents),
        centsToNumber(month.incomeCents - month.expenseCents),
      ])
      row.font = BODY_FONT
      row.height = 22
      row.getCell(2).font = { ...BODY_FONT, bold: true, color: { argb: COLORS.green } }
      row.getCell(3).font = { ...BODY_FONT, bold: true, color: { argb: COLORS.red } }
      row.getCell(4).font = { ...BODY_FONT, bold: true, color: { argb: COLORS.blue } }
      for (let column = 2; column <= 4; column += 1) row.getCell(column).numFmt = `${MONEY_FORMAT} "${this.options.currency}"`
      if (index % 2 === 1) row.fill = LIGHT_FILL
    })
    const totalRow = sheet.addRow([
      'Итого',
      centsToNumber(this.incomeCents),
      centsToNumber(this.expenseCents),
      centsToNumber(this.incomeCents - this.expenseCents),
    ])
    totalRow.font = { ...BODY_FONT, bold: true }
    totalRow.height = 24
    totalRow.border = { top: { style: 'medium', color: { argb: COLORS.navy } } }
    for (let column = 2; column <= 4; column += 1) totalRow.getCell(column).numFmt = `${MONEY_FORMAT} "${this.options.currency}"`

    sheet.mergeCells('F5:N5')
    sheet.getCell('F5').value = months.length > 12 ? 'Доходы и расходы · последние 12 месяцев' : 'Доходы и расходы'
    styleSectionHeader(sheet, 5, 6, 14)
    sheet.getCell('F6').value = '■ Доходы'
    sheet.getCell('F6').font = { ...BODY_FONT, bold: true, color: { argb: COLORS.green } }
    sheet.getCell('H6').value = '■ Расходы'
    sheet.getCell('H6').font = { ...BODY_FONT, bold: true, color: { argb: COLORS.red } }
    const bars = createMonthlyBarsPng(months.map((month) => ({
      income: centsToNumber(month.incomeCents),
      expense: centsToNumber(month.expenseCents),
    })))
    sheet.pageSetup.printArea = `A1:N${Math.max(22, totalRow.number)}`
    sheet.commit()
    return bars
  }

  async finalize(): Promise<ReportResult> {
    const range = this.resolveReportRange()
    this.finishTransactionsSheet()
    const donut = this.buildSummarySheet(range.label, range.days)
    this.buildCategoriesSheet(range.label)
    const monthlyBars = range.isMultiMonth ? this.buildMonthlySheet(range.label) : undefined

    const generatedDate = toLocalWallTime(this.options.generatedAt ?? new Date(), this.options.timezoneOffsetMinutes)
    const filename = `finance-report_${generatedDate.getUTCFullYear()}-${pad(generatedDate.getUTCMonth() + 1)}-${pad(generatedDate.getUTCDate())}.xlsx`
    const basePath = `${this.options.outputPath}.base`
    try {
      await this.workbook.commit()
      const images: WorksheetImage[] = [{
        sheetNumber: 1,
        drawingNumber: 1,
        imageNumber: 1,
        name: 'Распределение категорий расходов',
        png: donut,
        column: 4,
        columnOffsetPixels: 32,
        row: 13,
        rowOffsetPixels: 14,
        widthPixels: 330,
        heightPixels: 205,
      }]
      if (monthlyBars) {
        images.push({
          sheetNumber: 4,
          drawingNumber: 2,
          imageNumber: 2,
          name: 'Доходы и расходы по месяцам',
          png: monthlyBars,
          column: 5,
          columnOffsetPixels: 7,
          row: 6,
          rowOffsetPixels: 4,
          widthPixels: 650,
          heightPixels: 285,
        })
      }
      await embedWorksheetImages(basePath, this.options.outputPath, images)
    } finally {
      await rm(basePath, { force: true })
    }
    return { path: this.options.outputPath, filename, transactionCount: this.transactionCount, periodLabel: range.label }
  }
}
