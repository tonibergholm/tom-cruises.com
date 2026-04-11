'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(result.error)
      } else if (result?.ok) {
        router.push('/admin')
      }
    } catch (_err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem',
          border: '1px solid var(--color-border)',
        }}>
          <h1 style={{
            marginBottom: '0.5rem',
            textAlign: 'center',
            fontSize: '1.5rem',
            fontWeight: 750,
            letterSpacing: '-0.02em',
          }}>
            Admin
          </h1>
          <p style={{
            textAlign: 'center',
            color: 'var(--color-ink-faint)',
            fontSize: '0.88rem',
            marginBottom: '2rem',
          }}>
            Sign in to manage your boat
          </p>

          {error && <div className="message error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Your password"
              />
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%', marginBottom: '1.25rem', justifyContent: 'center' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: 'var(--color-ink-faint)', fontSize: '0.85rem' }}>
            <Link href="/">Back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
