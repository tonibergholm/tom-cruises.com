'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Post {
  id: number
  title: string
  slug: string
  published: boolean
  created_at: string
  updated_at: string
}

export default function PostsPage() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/posts')
        if (res.ok) {
          const data = await res.json()
          const boatSlug = (session?.user as any)?.boatSlug
          const filtered = data.filter((p: any) => p.boatSlug === boatSlug)
          setPosts(filtered)
        }
      } catch (err) {
        console.error('Failed to fetch posts:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [session])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this post?')) return

    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete post:', err)
    }
  }

  return (
    <>
      <h1>Blog Posts</h1>

      <div style={{ marginBottom: '2rem' }}>
        <Link href="/admin/posts/new" className="btn">
          Write New Post
        </Link>
      </div>

      {loading ? (
        <p>Loading posts...</p>
      ) : posts.length === 0 ? (
        <p>No posts yet. Start writing!</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td>{post.title}</td>
                <td>
                  <span style={{ color: post.published ? 'green' : 'orange' }}>
                    {post.published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td>{new Date(post.created_at).toLocaleDateString()}</td>
                <td>
                  <Link href={`/admin/posts/${post.id}`} style={{ marginRight: '1rem' }}>
                    Edit
                  </Link>
                  <button className="danger" onClick={() => handleDelete(post.id)} style={{ fontSize: '0.85rem' }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
