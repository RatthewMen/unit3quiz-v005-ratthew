import { useEffect, useState, useMemo } from 'react'
import './App.css'
import AuthForm from './components/AuthForm.jsx'
import { auth, firebaseInitError } from './firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { useSalesData } from './hooks/useSalesData.js'
import TimeFilters from './components/TimeFilters.jsx'
import SalesChart from './components/SalesChart.jsx'
import VoteCTA from './components/VoteCTA.jsx'

const initialView = () => {
  if (typeof window === 'undefined') return 'home'
  return window.location.hash.includes('account') ? 'account' : 'home'
}

const RANGE_LABELS = {
  month: 'Last month',
  '6m': 'Last 6 months',
  year: 'Past year',
  all: 'Full history',
}

function App() {
  const [user, setUser] = useState(null)
  const [view, setView] = useState(initialView)
  const [range, setRange] = useState('year') // 'month' | '6m' | 'year' | 'all'
  const { rows, loading, error, getFilteredRows } = useSalesData()
  const filtered = useMemo(() => getFilteredRows(range), [getFilteredRows, range])

  const summary = useMemo(() => {
    if (!filtered?.length) return null
    const retailTotal = filtered.reduce((sum, row) => sum + (row.retail ?? 0), 0)
    const warehouseTotal = filtered.reduce((sum, row) => sum + (row.warehouse ?? 0), 0)
    const last = filtered[filtered.length - 1]
    return {
      retailTotal,
      warehouseTotal,
      lastDate: last?.dateKey,
      periods: filtered.length,
    }
  }, [filtered])

  useEffect(() => {
    if (!auth) {
      setUser(null)
      return
    }
    const unsub = onAuthStateChanged(auth, (u) => setUser(u))
    return () => unsub()
  }, [])

  useEffect(() => {
    const onHashChange = () => {
      setView(window.location.hash.includes('account') ? 'account' : 'home')
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  function navigate(to) {
    setView(to)
    window.location.hash = to === 'account' ? '#/account' : '#/'
  }

  return (
    <div className="page">
      <div className="container stack-lg">
        <header className="topbar">
          <div className="brand">
            <div className="logo-dot" />
            <span>Supply Pulse</span>
          </div>
          <nav className="nav-links" aria-label="Primary">
            <button className={`nav-link${view === 'home' ? ' is-active' : ''}`} onClick={() => navigate('home')}>
              Dashboard
            </button>
            <button className={`nav-link${view === 'account' ? ' is-active' : ''}`} onClick={() => navigate('account')}>
              Account
            </button>
          </nav>
        </header>

        {view === 'home' && (
          <>
          <header className="hero card emphasis">
          <div className="hero-content">
            <div className="hero-meta">
              <span className="eyebrow">Supply pulse</span>
              <span className="pill">Range • {RANGE_LABELS[range]}</span>
            </div>
            <div className="hero-headline">
              <h1>Warehouse and Retail Sales</h1>
              <p className="lead">Track how warehouse throughput converts into retail demand. Use the filters to spot seasonality, momentum, and channel balance.</p>
            </div>
            <div className="hero-actions">
              <TimeFilters value={range} onChange={setRange} />
              <p className="muted">Switch the range to compare near-term shifts to long-term trends.</p>
            </div>
            {summary && (
              <div className="stat-grid">
                <div className="stat">
                  <p className="stat-label">Retail volume</p>
                  <p className="stat-value">{summary.retailTotal.toLocaleString()}</p>
                  <p className="muted">Across {summary.periods} periods</p>
                </div>
                <div className="stat">
                  <p className="stat-label">Warehouse volume</p>
                  <p className="stat-value">{summary.warehouseTotal.toLocaleString()}</p>
                  <p className="muted">Same timeframe</p>
                </div>
                <div className="stat">
                  <p className="stat-label">Latest period</p>
                  <p className="stat-value">{summary.lastDate || '—'}</p>
                  <p className="muted">Quick snapshot of the most recent data point</p>
                </div>
              </div>
            )}
          </div>
        </header>

          {/* Chart + filters */}
          <section className="card chart-card">
            <div className="control-row">
              <div>
                <p className="eyebrow">Performance</p>
                <h2>Channel comparison</h2>
              </div>
              {loading && <span className="pill">Loading data…</span>}
              {error && <span className="pill error-text">Error</span>}
            </div>
            {error && <p className="error-text">{error}</p>}
            {!error && (
              <>
                {loading ? (
                  <p className="muted">Preparing chart…</p>
                ) : filtered?.length ? (
                  <div className="chart-shell">
                    <SalesChart rows={filtered} />
                  </div>
                ) : (
                  <p className="muted">No data available for this range.</p>
                )}
              </>
            )}
          </section>

          {auth && user && <VoteCTA user={user} />}
        </>
        )}

        {view === 'account' && (
          <section className="card stack-md account-page">
            <div className="stack-sm">
              <p className="eyebrow">Account</p>
              <h1>Access your account</h1>
              <p className="lead">Sign in to save your vote, sync across devices, and manage your session.</p>
            </div>
            {!auth ? (
              <div className="stack-sm">
                <h3>App not configured</h3>
                <p className="error-text">{firebaseInitError || 'Firebase is not initialized.'}</p>
                <p className="muted">
                  Create a <code>.env.local</code> with your <code>VITE_FIREBASE_*</code> keys and restart <code>npm run dev</code>.
                </p>
              </div>
            ) : !user ? (
              <AuthForm />
            ) : (
              <div className="card stack-sm account-card">
                <div>
                  <p className="eyebrow">Signed in</p>
                  <h2>Account details</h2>
                </div>
                <p className="muted">{user.email}</p>
                <div className="control-row" style={{ justifyContent: 'flex-start' }}>
                  <button className="btn" onClick={() => signOut(auth)}>Sign out</button>
                  <button className="btn btn-ghost" onClick={() => navigate('home')}>Back to dashboard</button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}

export default App
