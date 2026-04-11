import { notFound } from 'next/navigation'
import Link from 'next/link'
import { query } from '@/lib/db'

interface BlogPost {
  id: number
  title: string
  slug: string
  content: string
  boat_name: string
  published_at: string
}

export const revalidate = 60

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let post: BlogPost | null = null

  try {
    const result = await query<BlogPost>(
      `SELECT bp.id, bp.title, bp.slug, bp.content, b.name as boat_name, bp.published_at
       FROM blog_posts bp
       JOIN boats b ON bp.boat_id = b.id
       WHERE bp.slug = $1 AND bp.published = true`,
      [slug]
    )

    if (result.rows.length === 0) {
      notFound()
    }

    post = result.rows[0]
  } catch (err) {
    console.error('Error fetching post:', err)
    notFound()
  }

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/blog">← Back to Stories</Link>
      </div>

      <article className="blog-post-detail">
        <h1>{post.title}</h1>
        <div className="meta">
          <span className="boat-name">{post.boat_name}</span> • Published on{' '}
          {new Date(post.published_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
        <div className="content">{post.content}</div>
      </article>

      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <Link href="/blog">← Back to All Stories</Link>
      </div>
    </>
  )
}
