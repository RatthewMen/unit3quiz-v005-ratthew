import { useEffect, useMemo, useState, useCallback } from 'react'
import Papa from 'papaparse'
import csvUrl from '../../Warehouse_and_Retail_Sales.csv?url'

function toDateKey(year, month) {
  const y = Number(year)
  const m = Number(month)
  if (!Number.isFinite(y) || !Number.isFinite(m)) return null
  const mm = String(m).padStart(2, '0')
  return `${y}-${mm}`
}

function safeNumber(value) {
  const n = typeof value === 'number' ? value : parseFloat(value)
  return Number.isFinite(n) ? n : 0
}

export function useSalesData() {
  const [allRows, setAllRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCancelled = false
    setLoading(true)
    setError('')

    const byMonth = new Map()
    let lastEmit = 0

    function emitIfDue(force = false) {
      const now = Date.now()
      if (!force && now - lastEmit < 250) return
      lastEmit = now
      const aggregated = Array.from(byMonth.values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey))
      setAllRows(aggregated)
    }

    function processChunk(data) {
      for (const row of data) {
        const dateKey = row.dateKey || toDateKey(row['YEAR'], row['MONTH'])
        if (!dateKey) continue
        const retail = safeNumber(row.retail ?? row['RETAIL SALES'])
        const warehouse = safeNumber(row.warehouse ?? row['WAREHOUSE SALES'])
        if (!byMonth.has(dateKey)) {
          byMonth.set(dateKey, { dateKey, retail: 0, warehouse: 0 })
        }
        const agg = byMonth.get(dateKey)
        agg.retail += retail
        agg.warehouse += warehouse
      }
    }

    async function loadSummaryThenCsv() {
      // Try a pre-aggregated summary (built from the CSV) for fastest startup
      try {
        const res = await fetch('/summary.json', { cache: 'no-cache' })
        if (res.ok) {
          const json = await res.json()
          if (!isCancelled && Array.isArray(json) && json.length) {
            processChunk(json)
            emitIfDue(true)
            setLoading(false)
            return
          }
        }
      } catch (_) {
        // fall through to CSV stream
      }

      loadCsvStreaming()
    }

    function loadCsvStreaming() {
      Papa.parse(csvUrl, {
        header: true,
        download: true,
        dynamicTyping: false, // manual numeric parsing for performance
        worker: true,
        skipEmptyLines: true,
        chunkSize: 256 * 1024, // bytes; tune for throughput vs UI responsiveness
        chunk: ({ data }) => {
          processChunk(data)
          if (!isCancelled) emitIfDue(false)
        },
        complete: () => {
          if (isCancelled) return
          emitIfDue(true)
          setLoading(false)
        },
        error: (err) => {
          if (isCancelled) return
          setError(err?.message || 'Failed to load data')
          setLoading(false)
        },
      })
    }

    loadSummaryThenCsv()

    return () => {
      isCancelled = true
    }
  }, [])

  const latestMonthKey = useMemo(() => {
    return allRows.length ? allRows[allRows.length - 1].dateKey : null
  }, [allRows])

  const getFilteredRows = useCallback(
    (range) => {
      if (!allRows.length) return []
      if (range === 'all') return allRows

      if (range === 'month') {
        const last = allRows[allRows.length - 1]
        return allRows.filter((r) => r.dateKey === last.dateKey)
      }

      if (range === '6m') {
        const start = Math.max(0, allRows.length - 6)
        return allRows.slice(start)
      }

      if (range === 'year') {
        const currentYear = new Date().getFullYear()
        const hasCurrent = allRows.some((r) => Number(r.dateKey.slice(0, 4)) === currentYear)
        const year = hasCurrent
          ? currentYear
          : Math.max(...allRows.map((r) => Number(r.dateKey.slice(0, 4))))
        return allRows.filter((r) => Number(r.dateKey.slice(0, 4)) === year)
      }

      return allRows
    },
    [allRows]
  )

  return { rows: allRows, loading, error, latestMonthKey, getFilteredRows }
}



