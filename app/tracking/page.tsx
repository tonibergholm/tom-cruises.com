'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import TrackingMap from '@/components/TrackingMap'

interface Position {
  boatId: number
  boatName: string
  lat: number
  lng: number
  createdAt: string
  note: string
}

export default function TrackingPage() {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const res = await fetch('/api/tracking')
        if (!res.ok) throw new Error('Failed to fetch positions')
        const data = await res.json()
        setPositions(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load positions')
      } finally {
        setLoading(false)
      }
    }

    fetchPositions()
    const interval = setInterval(fetchPositions, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/">← Back to Home</Link>
      </div>

      <h1 style={{ color: '#004466', marginBottom: '1rem' }}>Live Boat Tracking</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Track the current positions of Pamela and Lyyli across the Baltic Sea
      </p>

      {error && <div className="message error">{error}</div>}
      {loading && <div style={{ textAlign: 'center' }}>Loading map...</div>}

      {!loading && (
        <div className="tracking-container">
          <TrackingMap positions={positions} />

          {positions.length > 0 && (
            <div className="tracking-positions">
              <h3>Last Known Positions</h3>
              <table className="positions-table">
                <thead>
                  <tr>
                    <th>Boat</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th>Last Updated</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos) => (
                    <tr key={pos.boatId}>
                      <td>
                        <strong>{pos.boatName}</strong>
                      </td>
                      <td>{pos.lat.toFixed(6)}</td>
                      <td>{pos.lng.toFixed(6)}</td>
                      <td>{new Date(pos.createdAt).toLocaleString()}</td>
                      <td>{pos.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  )
}
