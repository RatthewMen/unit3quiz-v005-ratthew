import React, { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

function SalesChart({ rows }) {
  const { data, options } = useMemo(() => {
    const labels = rows.map((r) => r.dateKey)
    const data = {
      labels,
      datasets: [
        {
          label: 'Retail Sales',
          data: rows.map((r) => r.retail),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.15)',
          fill: true,
          tension: 0.25,
          pointRadius: 2,
        },
        {
          label: 'Warehouse Sales',
          data: rows.map((r) => r.warehouse),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34,197,94,0.15)',
          fill: true,
          tension: 0.25,
          pointRadius: 2,
        },
      ],
    }
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top' },
        tooltip: { enabled: true },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxRotation: 0, autoSkip: true, autoSkipPadding: 24 },
        },
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
        },
      },
    }
    return { data, options }
  }, [rows])

  return (
    <div style={{ width: '100%', height: 360 }}>
      <Line data={data} options={options} />
    </div>
  )
}

export default SalesChart



