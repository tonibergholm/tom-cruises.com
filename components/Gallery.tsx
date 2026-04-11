'use client'

import { useState, useEffect } from 'react'

interface GalleryPhoto {
  id: number
  filename: string
  alt?: string
}

interface GalleryProps {
  photos: GalleryPhoto[]
}

export default function Gallery({ photos }: GalleryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!photos || photos.length === 0) {
    return <p>No photos available for this boat.</p>
  }

  const openLightbox = (index: number) => {
    setCurrentIndex(index)
    setIsOpen(true)
  }

  const closeLightbox = () => {
    setIsOpen(false)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
  }

  const currentPhoto = photos[currentIndex]

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'ArrowRight') goToNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <>
      <div className="gallery-grid">
        {photos.map((photo, index) => (
          <div key={photo.id} className="gallery-item" onClick={() => openLightbox(index)}>
            <img src={`/uploads/${photo.filename}`} alt={photo.alt || 'Gallery photo'} />
          </div>
        ))}
      </div>

      <div className={`lightbox-overlay ${isOpen ? 'open' : ''}`} onClick={closeLightbox}>
        {isOpen && (
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={`/uploads/${currentPhoto.filename}`}
              alt={currentPhoto.alt || 'Gallery photo'}
            />
            <button className="lightbox-close" onClick={closeLightbox}>
              ✕
            </button>
            {photos.length > 1 && (
              <>
                <button className="lightbox-prev" onClick={goToPrevious}>
                  ‹
                </button>
                <button className="lightbox-next" onClick={goToNext}>
                  ›
                </button>
              </>
            )}
            <div style={{ textAlign: 'center', color: 'white', marginTop: '1rem' }}>
              {currentIndex + 1} / {photos.length}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
