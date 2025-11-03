"use client"

import { useEffect, useState } from 'react'

interface StreamingIconProps {
  icon: string | null
  name: string
  className?: string
}

export default function StreamingIcon({ icon, name, className = "" }: StreamingIconProps) {
  const [imageError, setImageError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(icon)

  useEffect(() => {
    setImageError(false)
    setCurrentSrc(icon)
  }, [icon])

  if (!icon) {
    return <span className={`text-2xl ${className}`}>📺</span>
  }

  if (icon.startsWith('/')) {
    if (imageError) {
      return <span className={`text-2xl ${className}`}>📺</span>
    }

    // Extract filename from path and use API endpoint
    const filename = icon.split('/').pop() || ''
    const apiSrc = `/api/uploads/streaming-icons/${filename}`

    return (
      <img
        src={currentSrc || apiSrc}
        alt={name}
        className={className}
        onError={(e) => {
          console.error('Image failed to load:', currentSrc || apiSrc)
          
          // Try fallback with original path
          if (!currentSrc || currentSrc === apiSrc) {
            console.log('Trying fallback to original path:', icon)
            setCurrentSrc(icon)
          } else {
            setImageError(true)
          }
        }}
        onLoad={() => {
          console.log('Image loaded successfully:', currentSrc || apiSrc)
        }}
      />
    )
  }

  return <span className={`text-2xl ${className}`}>{icon}</span>
}