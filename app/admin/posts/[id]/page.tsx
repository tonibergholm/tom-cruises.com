'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Post {
  id: number
  title: string
  excerpt: string
  content: string
  published: boolean
}

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params)
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/posts/${resolvedParams.id}`)
        if (res.ok) {
          const data = await res.json()
          setPost(data)
        } else {
          setMessage('Post not found')
        }
      } catch (err) {
        setMessage('Failed to load post')
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [resolvedParams.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as any).checked

    setPost((prev) => {
      if (!prev) return null
      return {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!post) return

    setSaving(true)
    setMessage('')

    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      })

      if (res.ok) {
        setMessage('Post updated successfully!')
        setTimeout(() => router.push('/admin/posts'), 1500)
      } else {
        setMessage('Failed to update post')
      }
    } catch (err) {
      setMessage('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p>Loading post...</p>
  }

  if (!post) {
    return <p>Post not found</p>
  }

  return (
    <>
      <h1>Edit Post</h1>

      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: '800px' }}>
        <div className="form-group">
          <label htmlFor="title">Post Title</label>
          <input
            id="title"
            name="title"
            type="text"
            value={post.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="excerpt">Excerpt</label>
          <textarea
            id="excerpt"
            name="excerpt"
            value={post.excerpt}
            onChange={handleChange}
            style={{ minHeight: '80px' }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            name="content"
            value={post.content}
            onChange={handleChange}
            required
            style={{ minHeight: '400px' }}
          />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="published"
              checked={post.published}
              onChange={handleChange}
            />
            Published
          </label>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href="/admin/posts" className="btn secondary">
            Cancel
          </Link>
        </div>
      </form>
    </>
  )
}
