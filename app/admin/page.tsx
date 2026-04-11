'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface Stats {
  photoCount: number
  postCount: number
  lastTrackingUpdate: string | null
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<Stats>({
    photoCount: 0,
    postCount: 0,
    lastTrackingUpdate: null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const boatSlug = (session?.user as any)?.boatSlug
        if (!boatSlug) return

        const photosRes = await fetch(`/api/photos?boatSlug=${boatSlug}`)
        const postsRes = await fetch('/api/posts')
        const trackingRes = await fetch('/api/tracking')

        const photos = photosRes.ok ? await photosRes.json() : []
        const posts = postsRes.ok ? await postsRes.json() : []
        const tracking = trackingRes.ok ? await trackingRes.json() : []

        const boatTracking = tracking.find((t: any) => t.boatSlug === boatSlug)

        setStats({
          photoCount: photos.length,
          postCount: posts.filter((p: any) => p.boatSlug === boatSlug).length,
          lastTrackingUpdate: boatTracking?.createdAt || null,
        })
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [session])

  return (
    <>
      <h1>Dashboard</h1>

      {loading ? (
        <p>Loading stats...</p>
      ) : (
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="number">{stats.photoCount}</div>
            <div className="label">Photos Uploaded</div>
          </div>
          <div className="stat-card">
            <div className="number">{stats.postCount}</div>
            <div className="label">Blog Posts</div>
          </div>
          <div className="stat-card">
            <div className="number">{stats.lastTrackingUpdate ? '✓' : '—'}</div>
            <div className="label">
              Last Position Update
              {stats.lastTrackingUpdate && (
                <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  {new Date(stats.lastTrackingUpdate).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', marginTop: '2rem' }}>
        <h2 style={{ color: '#004466', marginBottom: '1rem' }}>Quick Start</h2>
        <ul style={{ color: '#666' }}>
          <li style={{ marginBottom: '0.5rem' }}>
            <a href="/admin/boat">Edit your boat's profile</a> to update name, specs, and description
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <a href="/admin/photos">Upload photos</a> to build your boat's gallery
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <a href="/admin/posts">Write blog posts</a> to share stories and updates
          </li>
          <li style={{ marginBottom: '0.5rem' }}>
            <a href="/admin/tracking">Update your boat's position</a> or set up automatic tracking
          </li>
        </ul>
      </div>
    </>
  )
}
