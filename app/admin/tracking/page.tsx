'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface Position {
  id: number
  lat: number
  lng: number
  note: string
  created_at: string
}

export default function TrackingPage() {
  const { data: session } = useSession()
  const [positions, setPositions] = useState<Position[]>([])
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [note, setNote] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const boatSlug = (session?.user as any)?.boatSlug
        if (!boatSlug) return

        // Fetch positions
        const posRes = await fetch('/api/tracking')
        if (posRes.ok) {
          const data = await posRes.json()
          const boatPos = data
            .filter((p: any) => p.boatSlug === boatSlug)
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          setPositions(boatPos)
        }

        // Fetch boat to get API key
        const boatRes = await fetch(`/api/boats/${boatSlug}`)
        if (boatRes.ok) {
          const boat = await boatRes.json()
          setApiKey(boat.api_key || '')
        }
      } catch (err) {
        console.error('Failed to fetch:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      const res = await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          note: note || undefined,
        }),
      })

      if (res.ok) {
        const newPos = await res.json()
        setPositions((prev) => [newPos, ...prev])
        setMessage('Position updated successfully!')
        setLat('')
        setLng('')
        setNote('')
      } else {
        setMessage('Failed to update position')
      }
    } catch (err) {
      setMessage('An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return <p>Loading...</p>
  }

  return (
    <>
      <h1>Live Tracking</h1>

      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: '500px', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#004466', marginBottom: '1rem' }}>Update Position</h2>

        <div className="form-group">
          <label htmlFor="lat">Latitude</label>
          <input
            id="lat"
            type="number"
            step="0.000001"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="60.123456"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="lng">Longitude</label>
          <input
            id="lng"
            type="number"
            step="0.000001"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="25.123456"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="note">Note (optional)</label>
          <input
            id="note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g., Anchored in Helsinki"
          />
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Updating...' : 'Update Position'}
        </button>
      </form>

      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', color: '#004466', marginBottom: '1rem' }}>API Integration</h2>
        <p style={{ marginBottom: '1rem', color: '#666' }}>
          Use your boat's API key to automatically push positions from a GPS tracker:
        </p>
        <div style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
          <code style={{ wordBreak: 'break-all', fontSize: '0.9rem' }}>{apiKey}</code>
        </div>
        <button className="secondary" onClick={copyApiKey}>
          {copied ? 'Copied!' : 'Copy API Key'}
        </button>

        <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#666' }}>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>POST /api/tracking/ingest</strong>
          </p>
          <p>
            Body:
            <code style={{ display: 'block', marginTop: '0.25rem', backgroundColor: '#f5f5f5', padding: '0.5rem', borderRadius: '4px' }}>
              {JSON.stringify(
                {
                  apiKey: 'your-api-key',
                  lat: 60.123456,
                  lng: 25.123456,
                  note: 'optional note',
                },
                null,
                2
              )}
            </code>
          </p>
        </div>
      </div>

      {positions.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.2rem', color: '#004466', marginBottom: '1rem' }}>Position History (Last 10)</h2>
          <table className="positions-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {positions.slice(0, 10).map((pos) => (
                <tr key={pos.id}>
                  <td>{new Date(pos.created_at).toLocaleString()}</td>
                  <td>{pos.lat.toFixed(6)}</td>
                  <td>{pos.lng.toFixed(6)}</td>
                  <td>{pos.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
