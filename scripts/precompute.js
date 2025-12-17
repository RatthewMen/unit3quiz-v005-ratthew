import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')

const csvPath = path.join(root, 'Warehouse_and_Retail_Sales.csv')
const outDir = path.join(root, 'public')
const outPath = path.join(outDir, 'summary.json')

console.log('Precomputing summary from CSV...')

const csv = fs.readFileSync(csvPath, 'utf8')
const parsed = Papa.parse(csv, {
  header: true,
  skipEmptyLines: true,
  dynamicTyping: false,
})

const byMonth = new Map()

function toDateKey(year, month) {
  const y = Number(year)
  const m = Number(month)
  if (!Number.isFinite(y) || !Number.isFinite(m)) return null
  return `${y}-${String(m).padStart(2, '0')}`
}

function safeNumber(value) {
  const n = typeof value === 'number' ? value : parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

for (const row of parsed.data) {
  const dateKey = toDateKey(row['YEAR'], row['MONTH'])
  if (!dateKey) continue
  const retail = safeNumber(row['RETAIL SALES'])
  const warehouse = safeNumber(row['WAREHOUSE SALES'])
  if (!byMonth.has(dateKey)) {
    byMonth.set(dateKey, { dateKey, retail: 0, warehouse: 0 })
  }
  const agg = byMonth.get(dateKey)
  agg.retail += retail
  agg.warehouse += warehouse
}

const aggregated = Array.from(byMonth.values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey))

fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(outPath, JSON.stringify(aggregated), 'utf8')

console.log(`Wrote ${aggregated.length} rows to ${outPath}`)


