'use client'

import { useEffect, useRef } from 'react'

interface BoatPosition {
  boatId: number
  boatName: string
  lat: number
  lng: number
  createdAt: string
}

interface TrackingMapProps {
  positions: BoatPosition[]
}

declare global {
  interface Window {
    L: any
  }
}

export default function TrackingMap({ positions }: TrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    const loadMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return

      // Load Leaflet CSS
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
      document.head.appendChild(link)

      // Load Leaflet JS
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
      script.onload = () => {
        if (window.L) {
          const map = window.L.map(mapRef.current).setView([60, 25], 7)

          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
          }).addTo(map)

          // Add markers for each boat position
          positions.forEach((pos) => {
            const marker = window.L.marker([pos.lat, pos.lng]).addTo(map)
            const date = new Date(pos.createdAt).toLocaleString()
            marker.bindPopup(`<strong>${pos.boatName}</strong><br>${date}`)
          })

          mapInstanceRef.current = map
        }
      }
      document.head.appendChild(script)
    }

    loadMap()
  }, [positions])

  return <div ref={mapRef} className="tracking-map" />
}
