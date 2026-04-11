'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface Photo {
  id: number
  filename: string
  alt: string
}

export default function PhotosPage() {
  const { data: session } = useSession()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const boatSlug = (session?.user as any)?.boatSlug
        if (!boatSlug) return

        const res = await fetch(`/api/photos?boatSlug=${boatSlug}`)
        if (res.ok) {
          const data = await res.json()
          setPhotos(data)
        }
      } catch (err) {
        console.error('Failed to fetch photos:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPhotos()
  }, [session])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setUploading(true)
    setMessage('')

    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i])
    }

    try {
      const res = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const newPhotos = await res.json()
        setPhotos((prev) => [...prev, ...newPhotos])
        setMessage(`${newPhotos.length} photo(s) uploaded successfully!`)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        setMessage('Failed to upload photos')
      }
    } catch (err) {
      setMessage('An error occurred while uploading')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this photo?')) return

    try {
      const res = await fetch(`/api/photos/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== id))
        setMessage('Photo deleted')
      } else {
        setMessage('Failed to delete photo')
      }
    } catch (err) {
      setMessage('An error occurred')
    }
  }

  return (
    <>
      <h1>Manage Photos</h1>

      {message && (
        <div className={`message ${message.includes('successfully') || message.includes('deleted') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
        <p>Click to upload or drag and drop</p>
        <small>PNG, JPG, GIF up to 10MB each</small>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          disabled={uploading}
        />
      </div>

      {loading ? (
        <p>Loading photos...</p>
      ) : (
        <>
          {photos.length > 0 && (
            <>
              <h2 style={{ marginTop: '2rem', color: '#004466' }}>Your Photos ({photos.length})</h2>
              <div className="photo-grid">
                {photos.map((photo) => (
                  <div key={photo.id} className="photo-item">
                    <img src={`/uploads/${photo.filename}`} alt={photo.alt} />
                    <div className="photo-item-actions">
                      <button
                        className="danger"
                        onClick={() => handleDelete(photo.id)}
                        style={{ fontSize: '0.8rem' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
