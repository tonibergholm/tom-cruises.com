'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function ChangePasswordPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const isForced = session?.user?.mustChangePassword

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (newPassword.length < 8) {
      setMessage('Password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match')
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: isForced ? undefined : currentPassword,
          newPassword,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        // Update the session to clear mustChangePassword
        await update()
        setMessage('Password changed successfully!')
        setTimeout(() => router.push('/admin'), 1500)
      } else {
        setMessage(data.error || 'Failed to change password')
      }
    } catch (_err) {
      setMessage('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={isForced ? {
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    } : {}}>
      <div style={{ maxWidth: '440px', width: '100%', margin: isForced ? '0 auto' : undefined }}>
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem',
          border: '1px solid var(--color-border)',
        }}>
          <h1 style={{
            fontSize: '1.4rem',
            fontWeight: 750,
            letterSpacing: '-0.02em',
            marginBottom: '0.5rem',
          }}>
            {isForced ? 'Set Your Password' : 'Change Password'}
          </h1>
          <p style={{
            color: 'var(--color-ink-faint)',
            fontSize: '0.88rem',
            marginBottom: '2rem',
          }}>
            {isForced
              ? 'You must set a new password before continuing.'
              : 'Enter your current password and choose a new one.'}
          </p>

          {message && (
            <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {!isForced && (
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="At least 8 characters"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <button type="submit" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
              {saving ? 'Saving...' : 'Set Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
