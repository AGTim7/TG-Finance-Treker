import { PNG } from 'pngjs'

type Rgb = { red: number; green: number; blue: number }

const TRANSPARENT: Rgb = { red: 255, green: 255, blue: 255 }
const GRID: Rgb = { red: 222, green: 229, blue: 236 }
const INCOME: Rgb = { red: 16, green: 185, blue: 129 }
const EXPENSE: Rgb = { red: 244, green: 99, blue: 104 }

function parseColor(value: string): Rgb {
  const match = /^#([0-9a-f]{6})$/i.exec(value)
  if (!match) return { red: 37, green: 117, blue: 252 }

  return {
    red: Number.parseInt(match[1].slice(0, 2), 16),
    green: Number.parseInt(match[1].slice(2, 4), 16),
    blue: Number.parseInt(match[1].slice(4, 6), 16),
  }
}

function setPixel(png: PNG, x: number, y: number, color: Rgb, alpha = 255) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return
  const index = (png.width * y + x) << 2
  png.data[index] = color.red
  png.data[index + 1] = color.green
  png.data[index + 2] = color.blue
  png.data[index + 3] = alpha
}

function fillRect(
  png: PNG,
  x: number,
  y: number,
  width: number,
  height: number,
  color: Rgb,
) {
  const left = Math.max(0, Math.floor(x))
  const top = Math.max(0, Math.floor(y))
  const right = Math.min(png.width, Math.ceil(x + width))
  const bottom = Math.min(png.height, Math.ceil(y + height))

  for (let row = top; row < bottom; row += 1) {
    for (let column = left; column < right; column += 1) {
      setPixel(png, column, row, color)
    }
  }
}

export function createDonutChartPng(
  slices: Array<{ amount: number; color: string }>,
  width = 640,
  height = 360,
) {
  const png = new PNG({ width, height, colorType: 6 })
  const total = slices.reduce((sum, slice) => sum + Math.max(0, slice.amount), 0)
  const centerX = width / 2
  const centerY = height / 2
  const outerRadius = Math.min(width, height) * 0.39
  const innerRadius = outerRadius * 0.58
  const boundaries: Array<{ start: number; end: number; color: Rgb }> = []
  let angle = -Math.PI / 2

  if (total > 0) {
    slices.forEach((slice) => {
      const sweep = (Math.max(0, slice.amount) / total) * Math.PI * 2
      boundaries.push({ start: angle, end: angle + sweep, color: parseColor(slice.color) })
      angle += sweep
    })
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const dx = x + 0.5 - centerX
      const dy = y + 0.5 - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < innerRadius - 1 || distance > outerRadius + 1) continue

      const edgeAlpha = Math.max(
        0,
        Math.min(1, outerRadius + 0.5 - distance, distance - innerRadius + 0.5),
      )
      if (edgeAlpha <= 0) continue

      if (total === 0) {
        setPixel(png, x, y, GRID, Math.round(edgeAlpha * 255))
        continue
      }

      let pixelAngle = Math.atan2(dy, dx)
      if (pixelAngle < -Math.PI / 2) pixelAngle += Math.PI * 2
      const segment = boundaries.find((item) => pixelAngle >= item.start && pixelAngle < item.end)
        ?? boundaries.at(-1)
      if (!segment) continue

      const gap = 0.012
      const angularDistance = Math.min(pixelAngle - segment.start, segment.end - pixelAngle)
      if (angularDistance < gap) continue
      setPixel(png, x, y, segment.color, Math.round(edgeAlpha * 255))
    }
  }

  return PNG.sync.write(png)
}

export function createMonthlyBarsPng(
  months: Array<{ income: number; expense: number }>,
  width = 960,
  height = 420,
) {
  const png = new PNG({ width, height, colorType: 6 })
  const visible = months.slice(-12)
  const left = 34
  const top = 24
  const right = width - 22
  const bottom = height - 28
  const chartHeight = bottom - top
  const maximum = Math.max(1, ...visible.flatMap((month) => [month.income, month.expense]))

  for (let index = 0; index <= 4; index += 1) {
    const y = Math.round(top + (chartHeight * index) / 4)
    fillRect(png, left, y, right - left, 1, GRID)
  }

  if (visible.length === 0) return PNG.sync.write(png)

  const groupWidth = (right - left) / visible.length
  const barWidth = Math.max(3, Math.min(24, groupWidth * 0.27))
  visible.forEach((month, index) => {
    const center = left + groupWidth * index + groupWidth / 2
    const incomeHeight = (month.income / maximum) * chartHeight
    const expenseHeight = (month.expense / maximum) * chartHeight
    fillRect(png, center - barWidth - 2, bottom - incomeHeight, barWidth, incomeHeight, INCOME)
    fillRect(png, center + 2, bottom - expenseHeight, barWidth, expenseHeight, EXPENSE)
  })

  fillRect(png, left, bottom, right - left, 2, TRANSPARENT)
  return PNG.sync.write(png)
}
