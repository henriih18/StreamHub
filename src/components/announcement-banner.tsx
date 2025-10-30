'use client'

import { useEffect, useState } from 'react'

export function AnnouncementBanner() {
  const [banner, setBanner] = useState<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadBanner()
  }, [])

  const loadBanner = async () => {
    try {
      const response = await fetch('/api/announcement')
      if (response.ok) {
        const data = await response.json()
        if (data.isActive && data.text) {
          setBanner(data)
        }
      }
    } catch (error) {
      console.error('Error loading banner:', error)
    }
  }

  if (!mounted || !banner) {
    return null
  }

  return (
    <div 
      className="w-full overflow-hidden relative z-40"
      style={{ 
        backgroundColor: banner.backgroundColor || '#000000',
        color: banner.textColor || '#ffffff'
      }}
    >
      <div className="relative">
        <div 
          className="whitespace-nowrap py-2 px-4 inline-block"
          style={{
            display: 'inline-block',
            whiteSpace: 'nowrap',
            animation: `scroll ${banner.speed || 20}s linear infinite`
          }}
        >
          <span className="inline-block px-4">{banner.text}</span>
          <span className="inline-block px-4">{banner.text}</span>
          <span className="inline-block px-4">{banner.text}</span>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes scroll {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-33.333%); }
          }
        `
      }} />
    </div>
  )
}