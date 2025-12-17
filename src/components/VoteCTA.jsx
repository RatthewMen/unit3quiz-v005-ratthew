import React, { useEffect, useState } from 'react'
import { auth, db } from '../firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

const STANCE_TEXT =
  'Based on the sales data trends, I support policies that improve supply planning to reduce stockouts and optimize warehouse-to-retail flow.'

function VoteCTA({ user }) {
  const [hasVoted, setHasVoted] = useState(false)
  const [vote, setVote] = useState(null) // 'yes' | 'no' | null
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        if (!user || !db) {
          setHasVoted(false)
          return
        }
        const ref = doc(db, 'votes', user.uid)
        const snap = await getDoc(ref)
        if (!isCancelled) {
          setHasVoted(snap.exists())
          setVote(snap.data()?.vote ?? null)
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
        email: user.email || null,
      })
      setHasVoted(true)
      setVote(choice)
    } catch (e) {
      setError(e?.message || 'Failed to register your response')
    }
  }

  if (loading) {
    return (
      <div className="card vote-card stack-sm">
        <p>Loading…</p>
      </div>
    )
  }

  if (hasVoted) {
    return (
      <div className="card vote-card stack-sm">
        <h3>Thanks for your response</h3>
        <p className="muted">You answered: {vote === 'yes' ? 'Yes' : vote === 'no' ? 'No' : 'Submitted'}</p>
      </div>
    )
  }

  return (
    <div className="card vote-card stack-sm">
      <div>
        <p className="eyebrow">Civic voice</p>
        <h3>Register your support</h3>
      </div>
      <p className="muted">{STANCE_TEXT}</p>
      <div className="segmented-control">
        <button className="btn btn-primary" onClick={() => handleVote('yes')} disabled={!auth || !user}>
          Yes
        </button>
        <button className="btn" onClick={() => handleVote('no')} disabled={!auth || !user}>
          No
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}

export default VoteCTA



