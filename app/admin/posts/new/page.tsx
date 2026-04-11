'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewPostPage() {
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [published, setPublished] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, excerpt, content, published }),
      })

      if (res.ok) {
        await res.json()
        router.push('/admin/posts')
      } else {
        setMessage('Failed to create post')
      }
    } catch (err) {
      setMessage('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <h1>Write New Post</h1>

      {message && <div className="message error">{message}</div>}

      <form onSubmit={handleSubmit} style={{ maxWidth: '800px' }}>
        <div className="form-group">
          <label htmlFor="title">Post Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="excerpt">Excerpt (Short summary)</label>
          <textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            style={{ minHeight: '80px' }}
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">Content (Markdown supported)</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            style={{ minHeight: '400px' }}
          />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
            Publish immediately
          </label>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Create Post'}
          </button>
          <Link href="/admin/posts" className="btn secondary">
            Cancel
          </Link>
        </div>
      </form>
    </>
  )
}
