'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface BoatData {
  name: string
  model: string
  type: string
  year_built: string
  length: string
  material: string
  description: string
  features: string
}

export default function BoatPage() {
  const { data: session } = useSession()
  const [boat, setBoat] = useState<BoatData>({
    name: '',
    model: '',
    type: '',
    year_built: '',
    length: '',
    material: '',
    description: '',
    features: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchBoat = async () => {
      try {
        const boatSlug = (session?.user as any)?.boatSlug
        if (!boatSlug) return

        const res = await fetch(`/api/boats/${boatSlug}`)
        if (res.ok) {
          const data = await res.json()
          setBoat(data)
        }
      } catch (err) {
        console.error('Failed to fetch boat:', err)
        setMessage('Failed to load boat data')
      } finally {
        setLoading(false)
      }
    }

    fetchBoat()
  }, [session])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setBoat((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const boatSlug = (session?.user as any)?.boatSlug
      const res = await fetch(`/api/boats/${boatSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(boat),
      })

      if (res.ok) {
        setMessage('Boat updated successfully!')
      } else {
        setMessage('Failed to update boat')
      }
    } catch (err) {
      setMessage('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p>Loading boat data...</p>
  }

  return (
    <>
      <h1>Edit My Boat</h1>

      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
        <div className="form-group">
          <label htmlFor="name">Boat Name</label>
          <input id="name" name="name" type="text" value={boat.name} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="model">Model</label>
          <input id="model" name="model" type="text" value={boat.model} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="type">Type</label>
          <input id="type" name="type" type="text" value={boat.type} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="year_built">Year Built</label>
          <input id="year_built" name="year_built" type="text" value={boat.year_built} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="length">Length</label>
          <input id="length" name="length" type="text" value={boat.length} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="material">Material</label>
          <input id="material" name="material" type="text" value={boat.material} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea name="description" id="description" value={boat.description} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="features">Features</label>
          <textarea name="features" id="features" value={boat.features} onChange={handleChange} />
        </div>

        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </>
  )
}
