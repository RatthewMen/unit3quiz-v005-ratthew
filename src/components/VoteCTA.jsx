import React, { useEffect, useMemo, useState } from 'react'
import { auth, db } from '../firebase'
import { collection, doc, getCountFromServer, getDoc, query, setDoc, serverTimestamp, where } from 'firebase/firestore'

const STANCE_TEXT =
  'Based on the sales data trends, I support policies that improve supply planning to reduce stockouts and optimize warehouse-to-retail flow.'

function VoteCTA({ user }) {
  const [hasVoted, setHasVoted] = useState(false)
  const [vote, setVote] = useState(null) // 'yes' | 'no' | null
  const [loading, setLoading] = useState(true)
  const [loadingCounts, setLoadingCounts] = useState(true)
  const [error, setError] = useState('')
  const [counts, setCounts] = useState({ yes: 0, no: 0, total: 0 })

  const yesPct = useMemo(() => {
    if (!counts.total) return 0
    return Math.round((counts.yes / counts.total) * 100)
  }, [counts])

  const noPct = useMemo(() => {
    if (!counts.total) return 0
    return 100 - yesPct
  }, [counts])

  async function loadCounts() {
    if (!db) return
    setLoadingCounts(true)
    try {
      const votesCol = collection(db, 'votes')
      const [yesSnap, noSnap, totalSnap] = await Promise.all([
        getCountFromServer(query(votesCol, where('vote', '==', 'yes'))),
        getCountFromServer(query(votesCol, where('vote', '==', 'no'))),
        getCountFromServer(votesCol),
      ])
      setCounts({
        yes: yesSnap.data().count || 0,
        no: noSnap.data().count || 0,
        total: totalSnap.data().count || 0,
      })
    } catch (e) {
      setError(e?.message || 'Failed to load vote totals')
    } finally {
      setLoadingCounts(false)
    }
  }

  useEffect(() => {
    let isCancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        if (user && db) {
          const ref = doc(db, 'votes', user.uid)
          const snap = await getDoc(ref)
          if (!isCancelled) {
            setHasVoted(snap.exists())
            setVote(snap.data()?.vote ?? null)
          }
        } else {
          if (!isCancelled) {
            setHasVoted(false)
            setVote(null)
          }
        }
      } catch (e) {
        if (!isCancelled) setError(e?.message || 'Failed to load vote')
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }
    load()
    return () => {
      isCancelled = true
    }
  }, [user])

  useEffect(() => {
    loadCounts()
  }, [])

  async function handleVote(choice) {
    if (!user || !db) return
    setError('')
    try {
      const ref = doc(db, 'votes', user.uid)
      await setDoc(ref, {
        votedAt: serverTimestamp(),
        vote: choice, // 'yes' | 'no'
        stanceVersion: 1,
        stanceText: STANCE_TEXT,
        uid: user.uid,
        // email intentionally omitted to keep votes lightweight and public-read safe
      })
      setHasVoted(true)
      setVote(choice)
      loadCounts()
    } catch (e) {
      setError(e?.message || 'Failed to register your response')
    }
  }

  const needsVote = Boolean(auth && user && !hasVoted)
  const showResults = !needsVote

  return (
    <div className="card vote-card stack-md">
      <div className="stack-sm">
        <p className="eyebrow">Civic voice</p>
        <h3>Register your support</h3>
        <p className="muted">{STANCE_TEXT}</p>
      </div>

      {loading ? (
        <p className="muted">Loading your status…</p>
      ) : needsVote ? (
        <div className="stack-sm">
          <p>Cast your vote. You can only vote once.</p>
          <div className="segmented-control">
            <button className="btn btn-primary" onClick={() => handleVote('yes')} disabled={!auth || !user || loading}>
              Accept
            </button>
            <button className="btn" onClick={() => handleVote('no')} disabled={!auth || !user || loading}>
              Deny
            </button>
          </div>
        </div>
      ) : (
        <div className="vote-results">
          <div
            className="vote-ring"
            style={{
              background: `conic-gradient(#22c55e ${yesPct}%, #ef4444 ${yesPct}% 100%)`,
            }}
          >
            <div className="vote-ring-inner">
              {loadingCounts ? (
                <span className="muted">…</span>
              ) : (
                <>
                  <strong>{yesPct || 0}%</strong>
                  <span className="muted">Yes share</span>
                </>
              )}
            </div>
          </div>
          <div className="stack-sm">
            <p className="muted">Community tally</p>
            {loadingCounts ? (
              <p className="muted">Loading totals…</p>
            ) : counts.total ? (
              <>
                <div className="vote-legend yes">Yes • {counts.yes} ({yesPct}%)</div>
                <div className="vote-legend no">No • {counts.no} ({noPct}%)</div>
                <div className="muted">Total votes: {counts.total}</div>
              </>
            ) : (
              <p className="muted">No votes yet. Be the first to vote.</p>
            )}
          </div>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}
    </div>
  )
}

export default VoteCTA



