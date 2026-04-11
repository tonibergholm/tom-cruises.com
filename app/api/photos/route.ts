import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

interface BoatImage {
  id: number
  filename: string
  alt: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const boatSlug = searchParams.get('boatSlug')

    if (!boatSlug) {
      return NextResponse.json({ error: 'boatSlug required' }, { status: 400 })
    }

    const result = await query<BoatImage>(
      `SELECT bi.id, bi.filename, bi.alt FROM boat_images bi
       JOIN boats b ON bi.boat_id = b.id
       WHERE b.slug = $1
       ORDER BY bi.sort_order ASC`,
      [boatSlug]
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('GET /api/photos error:', error)
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

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
    const uploadDir = join(process.cwd(), 'public', 'uploads')

    // Create uploads directory if it doesn't exist
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (err) {
      // Directory might already exist
    }

    const uploadedPhotos: BoatImage[] = []

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const filename = `${randomUUID()}-${file.name}`
      const filepath = join(uploadDir, filename)

      await writeFile(filepath, Buffer.from(bytes))

      const imgResult = await query<BoatImage>(
        'INSERT INTO boat_images (boat_id, filename, alt, sort_order) VALUES ($1, $2, $3, $4) RETURNING id, filename, alt',
        [boatId, filename, file.name, 0]
      )

      if (imgResult.rows.length > 0) {
        uploadedPhotos.push(imgResult.rows[0])
      }
    }

    return NextResponse.json(uploadedPhotos)
  } catch (error) {
    console.error('POST /api/photos error:', error)
    return NextResponse.json({ error: 'Failed to upload photos' }, { status: 500 })
  }
}
