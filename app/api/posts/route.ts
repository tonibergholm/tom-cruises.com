import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { query } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt: string
  published: boolean
  created_at: string
  updated_at: string
  boatSlug: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const published = searchParams.get('published') !== 'false'

    let sql = `SELECT bp.id, bp.title, bp.slug, bp.excerpt, bp.published, bp.created_at, bp.updated_at, b.slug as boatSlug
       FROM blog_posts bp
       JOIN boats b ON bp.boat_id = b.id`

    const params: (string | boolean)[] = []

    if (published) {
      sql += ' WHERE bp.published = $1'
      params.push(true)
    }

    sql += ' ORDER BY bp.published_at DESC NULLS LAST'

    const result = await query<BlogPost>(sql, params.length > 0 ? params : undefined)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('GET /api/posts error:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, excerpt, content, published } = body
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
    const slug = slugify(title) + '-' + Date.now()
    const publishedAt = published ? new Date() : null

    const result = await query<BlogPost>(
      `INSERT INTO blog_posts (boat_id, user_id, title, slug, excerpt, content, published, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, title, slug, excerpt, published, created_at, updated_at`,
      [boatId, user.id, title, slug, excerpt, content, published || false, publishedAt]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('POST /api/posts error:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
