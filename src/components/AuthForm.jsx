import { useState } from 'react'
import { auth } from '../firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'

function AuthForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('signIn') // 'signIn' | 'signUp'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signUp') {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (err) {
      setError(err.message ?? 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card stack-sm auth-card">
      <div className="stack-sm" style={{ textAlign: 'center' }}>
        <p className="eyebrow">Account</p>
        <h2>{mode === 'signUp' ? 'Create account' : 'Sign in'}</h2>
        <p className="muted">Save your vote securely and sync across devices.</p>
      </div>
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="input"
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'signUp' ? 'Sign up' : 'Sign in'}
        </button>
      </form>
      <div className="form-footer">
        <button className="btn btn-ghost" type="button" onClick={() => setMode(mode === 'signUp' ? 'signIn' : 'signUp')}>
          {mode === 'signUp' ? 'Have an account? Sign in' : "New here? Create an account"}
        </button>
      </div>
      {error && <p className="error-text" style={{ textAlign: 'center' }}>{error}</p>}
    </div>
  )
}

export default AuthForm



