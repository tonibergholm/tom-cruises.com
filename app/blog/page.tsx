import Link from 'next/link'
import { query } from '@/lib/db'

interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt: string
  boat_name: string
  published_at: string
}

export const revalidate = 60

export default async function BlogPage() {
  let posts: BlogPost[] = []
  let error = ''

  try {
    const result = await query<BlogPost>(
      `SELECT bp.id, bp.title, bp.slug, bp.excerpt, b.name as boat_name, bp.published_at
       FROM blog_posts bp
       JOIN boats b ON bp.boat_id = b.id
       WHERE bp.published = true
       ORDER BY bp.published_at DESC`
    )
    posts = result.rows
  } catch (err) {
    console.error('Error fetching posts:', err)
    error = 'Failed to load blog posts'
  }

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/">← Back to Home</Link>
      </div>

      <h1 style={{ color: '#004466', marginBottom: '2rem' }}>Stories from the Sea</h1>

      {error && <div className="message error">{error}</div>}

      {posts.length === 0 ? (
        <p style={{ color: '#666', fontSize: '1.1rem' }}>No stories published yet. Check back soon!</p>
      ) : (
        <div className="blog-posts">
          {posts.map((post) => (
            <div key={post.id} className="blog-post-item">
              <h2 style={{ margin: '0 0 0.5rem 0' }}>
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className="blog-post-meta">
                <span className="boat-name">{post.boat_name}</span> •{' '}
                {new Date(post.published_at).toLocaleDateString()}
              </p>
              <p className="blog-post-excerpt">{post.excerpt}</p>
              <Link href={`/blog/${post.slug}`}>Read Full Story →</Link>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
