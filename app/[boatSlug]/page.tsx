import { notFound } from 'next/navigation'
import Link from 'next/link'
import Gallery from '@/components/Gallery'
import { query } from '@/lib/db'

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
}

interface BoatImage {
  id: number
  filename: string
  alt: string
}

interface BlogPost {
  id: number
  title: string
  slug: string
  excerpt: string
  published_at: string
}

export const revalidate = 60

export default async function BoatDetail({ params }: { params: Promise<{ boatSlug: string }> }) {
  const { boatSlug } = await params
  let boat: Boat | null = null
  let images: BoatImage[] = []
  let posts: BlogPost[] = []

  try {
    // Fetch boat
    const boatResult = await query<Boat>(
      'SELECT id, name, slug, model, type, year_built, length, material, description, features FROM boats WHERE slug = $1',
      [boatSlug]
    )

    if (boatResult.rows.length === 0) {
      notFound()
    }

    boat = boatResult.rows[0]

    // Fetch images
    const imagesResult = await query<BoatImage>(
      'SELECT id, filename, alt FROM boat_images WHERE boat_id = $1 ORDER BY sort_order ASC',
      [boat.id]
    )
    images = imagesResult.rows

    // Fetch recent posts
    const postsResult = await query<BlogPost>(
      `SELECT id, title, slug, excerpt, published_at FROM blog_posts
       WHERE boat_id = $1 AND published = true
       ORDER BY published_at DESC
       LIMIT 5`,
      [boat.id]
    )
    posts = postsResult.rows
  } catch (err) {
    console.error('Error fetching boat data:', err)
    notFound()
  }

  const specs = [
    { label: 'Name', value: boat.name },
    ...(boat.model ? [{ label: 'Model', value: boat.model }] : []),
    ...(boat.type ? [{ label: 'Type', value: boat.type }] : []),
    ...(boat.year_built ? [{ label: 'Year Built', value: boat.year_built }] : []),
    ...(boat.length ? [{ label: 'Length', value: boat.length }] : []),
    ...(boat.material ? [{ label: 'Material', value: boat.material }] : []),
  ]

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/">← Back to Home</Link>
      </div>

      <h1 style={{ marginBottom: '0.25rem', fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 750, letterSpacing: '-0.03em' }}>{boat.name}</h1>
      <p style={{ color: 'var(--color-ink-faint)', marginBottom: '2rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>{boat.type}</p>

      {boat.description && (
        <div style={{ background: 'var(--color-surface)', padding: '1.75rem', borderRadius: 'var(--radius)', marginBottom: '2rem', border: '1px solid var(--color-border)' }}>
          <p style={{ lineHeight: '1.85', color: 'var(--color-ink-muted)', fontSize: '1.02rem' }}>{boat.description}</p>
        </div>
      )}

      <div className="boat-specs">
        <h2 style={{ marginBottom: '1rem', fontSize: '1.15rem', fontWeight: 650 }}>Specifications</h2>
        <table className="specs-table">
          <tbody>
            {specs.map((spec, idx) => (
              <tr key={idx}>
                <td>{spec.label}</td>
                <td>{spec.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {boat.features && (
        <div className="boat-specs">
          <h2 style={{ marginBottom: '1rem', fontSize: '1.15rem', fontWeight: 650 }}>Features</h2>
          <p>{boat.features}</p>
        </div>
      )}

      {images.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.15rem', fontWeight: 650 }}>Gallery</h2>
          <Gallery photos={images} />
        </div>
      )}

      {posts.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.15rem', fontWeight: 650 }}>Recent Stories</h2>
          <div className="blog-posts">
            {posts.map((post) => (
              <div key={post.id} className="blog-post-item">
                <h3>{post.title}</h3>
                <p className="blog-post-meta">{new Date(post.published_at).toLocaleDateString()}</p>
                <p className="blog-post-excerpt">{post.excerpt}</p>
                <Link href={`/blog/${post.slug}`}>Read Full Story</Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
