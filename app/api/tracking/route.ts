import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface TrackingPosition {
  id: number
  boatId: number
  boatName: string
  boatSlug: string
  lat: number
  lng: number
  note: string
  speed: number | null
  heading: number | null
  createdAt: string
}

export async function GET(_request: NextRequest) {
  try {
    const result = await query<TrackingPosition>(
      `SELECT bt.id, b.id as boatId, b.name as boatName, b.slug as boatSlug, bt.lat, bt.lng, bt.note, bt.speed, bt.heading, bt.created_at as createdAt
       FROM boat_tracking bt
       JOIN boats b ON bt.boat_id = b.id
       WHERE bt.id IN (
         SELECT MAX(id) FROM boat_tracking GROUP BY boat_id
       )
       ORDER BY b.name`
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('GET /api/tracking error:', error)
    return NextResponse.json({ error: 'Failed to fetch tracking data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { lat, lng, note, speed, heading } = body
    const user = session.user as any
    const boatSlug = user.boatSlug

    // Fetch boat ID
    const boatResult = await query<{ id: number }>(
      'SELECT id FROM boats WHERE slug = $1',
      [boatSlug]
    )

    if (boatResult.rows.length === 0) {
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 })
    }

    const boatId = boatResult.rows[0].id

    const result = await query<TrackingPosition>(
      `INSERT INTO boat_tracking (boat_id, lat, lng, note, speed, heading)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, boat_id as boatId, lat, lng, note, speed, heading, created_at as createdAt`,
      [boatId, lat, lng, note || null, speed || null, heading || null]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to create tracking entry' }, { status: 500 })
    }

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('POST /api/tracking error:', error)
    return NextResponse.json({ error: 'Failed to update tracking' }, { status: 500 })
  }
}
