import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import { join } from 'path'

interface BoatImage {
  boat_id: number
  filename: string
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any
    const boatSlug = user.boatSlug

    // Fetch photo and verify ownership
    const photoResult = await query<BoatImage>(
      `SELECT bi.boat_id, bi.filename FROM boat_images bi
       JOIN boats b ON bi.boat_id = b.id
       WHERE bi.id = $1 AND b.slug = $2`,
      [id, boatSlug]
    )

    if (photoResult.rows.length === 0) {
      return NextResponse.json({ error: 'Photo not found or unauthorized' }, { status: 404 })
    }

    const photo = photoResult.rows[0]
    const filepath = join(process.cwd(), 'public', 'uploads', photo.filename)

    // Delete file from filesystem
    try {
      await unlink(filepath)
    } catch (err) {
      console.warn('Failed to delete file from filesystem:', err)
      // Continue anyway - remove from database
    }

    // Delete from database
    await query('DELETE FROM boat_images WHERE id = $1', [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/photos/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 })
  }
}
