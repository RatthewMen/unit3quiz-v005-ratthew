import React from 'react'

const OPTIONS = [
  { key: 'month', label: 'Month' },
  { key: '6m', label: '6 months' },
  { key: 'year', label: 'Year' },
  { key: 'all', label: 'All time' },
]

function TimeFilters({ value, onChange }) {
  return (
    <div className="segmented-control">
      {OPTIONS.map((opt) => {
        const active = value === opt.key
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={`btn btn-segment${active ? ' is-active' : ''}`}
            aria-pressed={active}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export default TimeFilters



