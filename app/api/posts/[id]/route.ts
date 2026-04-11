import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface BlogPost {
  id: number
  boat_id: number
  title: string
  slug: string
  excerpt: string
  content: string
  published: boolean
  created_at: string
  updated_at: string
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const result = await query<BlogPost>(
      `SELECT id, boat_id, title, slug, excerpt, content, published, created_at, updated_at
       FROM blog_posts
       WHERE id = $1 AND published = true`,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('GET /api/posts/[id] error:', error)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
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

    // Verify ownership
    const postResult = await query<{ boat_id: number }>(
      `SELECT bp.boat_id FROM blog_posts bp
       JOIN boats b ON bp.boat_id = b.id
       WHERE bp.id = $1 AND b.slug = $2`,
      [id, boatSlug]
    )

    if (postResult.rows.length === 0) {
      return NextResponse.json({ error: 'Post not found or unauthorized' }, { status: 404 })
    }

    const body = await request.json()
    const { title, excerpt, content, published } = body
    const publishedAt = published ? new Date() : null

    await query(
      `UPDATE blog_posts SET title = $1, excerpt = $2, content = $3, published = $4, published_at = $5, updated_at = NOW()
       WHERE id = $6`,
      [title, excerpt, content, published || false, publishedAt, id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PUT /api/posts/[id] error:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
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

    // Verify ownership
    const postResult = await query<{ boat_id: number }>(
      `SELECT bp.boat_id FROM blog_posts bp
       JOIN boats b ON bp.boat_id = b.id
       WHERE bp.id = $1 AND b.slug = $2`,
      [id, boatSlug]
    )

    if (postResult.rows.length === 0) {
      return NextResponse.json({ error: 'Post not found or unauthorized' }, { status: 404 })
    }

    await query('DELETE FROM blog_posts WHERE id = $1', [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/posts/[id] error:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
