import { query } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface BoatWithKey {
  id: number
  api_key: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiKey, lat, lng, note, speed, heading } = body

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 })
    }

    if (lat === undefined || lng === undefined) {
      return NextResponse.json({ error: 'Latitude and longitude required' }, { status: 400 })
    }

    // Fetch boat by API key
    const boatResult = await query<BoatWithKey>(
      'SELECT id, api_key FROM boats WHERE api_key = $1',
      [apiKey]
    )

    if (boatResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    const boatId = boatResult.rows[0].id

    // Insert tracking position
    const result = await query(
      `INSERT INTO boat_tracking (boat_id, lat, lng, note, speed, heading)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [boatId, lat, lng, note || null, speed || null, heading || null]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to save position' }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Position recorded',
        data: result.rows[0],
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/tracking/ingest error:', error)
    return NextResponse.json({ error: 'Failed to ingest tracking data' }, { status: 500 })
  }
}
