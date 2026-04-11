import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface Boat {
  id: number
  name: string
  slug: string
  model: string
  type: string
  year_built: string
  length: string
  material: string
  description: string
  features: string
  cover_image: string
  api_key: string
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  try {
    const result = await query<Boat>(
      'SELECT id, name, slug, model, type, year_built, length, material, description, features, cover_image, api_key FROM boats WHERE slug = $1',
      [slug]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Boat not found' }, { status: 404 })
    }

    const boat = result.rows[0]
    // Don't expose API key to public GET request
    const publicBoat = { ...boat, api_key: undefined }

    return NextResponse.json(publicBoat)
  } catch (error) {
    console.error('GET /api/boats/[slug] error:', error)
    return NextResponse.json({ error: 'Failed to fetch boat' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any)?.boatSlug !== slug) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, model, type, year_built, length, material, description, features } = body

    await query(
      `UPDATE boats SET name = $1, model = $2, type = $3, year_built = $4, length = $5, material = $6, description = $7, features = $8, updated_at = NOW()
       WHERE slug = $9`,
      [name, model, type, year_built, length, material, description, features, slug]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PUT /api/boats/[slug] error:', error)
    return NextResponse.json({ error: 'Failed to update boat' }, { status: 500 })
  }
}
