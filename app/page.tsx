import Link from 'next/link'
import { query } from '@/lib/db'

interface Boat {
  id: number
  name: string
  slug: string
  type: string
  description: string
  cover_image: string
}

interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt: string
  boat_name: string
  published_at: string
}

export const revalidate = 60

export default async function Home() {
  let boats: Boat[] = []
  let blogPosts: BlogPost[] = []
  let error = ''

  try {
    // Fetch boats
    const boatsResult = await query<Boat>(
      'SELECT id, name, slug, type, description, cover_image FROM boats ORDER BY name'
    )
    boats = boatsResult.rows

    // Fetch latest blog posts
    const postsResult = await query<BlogPost>(
      `SELECT bp.id, bp.title, bp.slug, bp.excerpt, b.name as boat_name, bp.published_at
       FROM blog_posts bp
       JOIN boats b ON bp.boat_id = b.id
       WHERE bp.published = true
       ORDER BY bp.published_at DESC
       LIMIT 3`
    )
    blogPosts = postsResult.rows
  } catch (err) {
    console.error('Error fetching data:', err)
    error = 'Failed to load content'
  }

  return (
    <>
      <div className="welcome-box">
        <h2>Welcome to Tom Cruises</h2>
        <p>
          Follow the maritime adventures of two beautiful vessels: Pamela, a lovingly self-built wooden
          yacht, and Lyyli, a classic Albatross 26 sailing yacht. Track their positions, read stories,
          and discover the passion behind these timeless boats.
        </p>
      </div>

      {error && <div className="message error">{error}</div>}

      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Our Boats</h2>
      <div className="boat-cards">
        {boats.map((boat) => (
          <div key={boat.id} className="boat-card">
            <div className="boat-card-image">
              {boat.cover_image ? (
                <img src={boat.cover_image} alt={boat.name} />
              ) : (
                <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--color-bg)' }} />
              )}
            </div>
            <div className="boat-card-content">
              <h3>{boat.name}</h3>
              <p className="type">{boat.type}</p>
              <p>{boat.description?.split(/(?<=\.)\s/).slice(0, 2).join(' ')}</p>
              <Link href={`/${boat.slug}`}>View Details</Link>
            </div>
          </div>
        ))}
      </div>

      {blogPosts.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Latest Stories</h2>
          <div className="blog-posts">
            {blogPosts.map((post) => (
              <div key={post.id} className="blog-post-item">
                <h3>{post.title}</h3>
                <p className="blog-post-meta">
                  <span className="boat-name">{post.boat_name}</span> •{' '}
                  {new Date(post.published_at).toLocaleDateString()}
                </p>
                <p className="blog-post-excerpt">{post.excerpt}</p>
                <Link href={`/blog/${post.slug}`}>Read Full Story</Link>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link href="/blog" className="btn">
              View All Stories
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
