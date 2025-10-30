'use client'

import { useState } from 'react'
import StreamingIcon from '@/components/admin/streaming-icon'

export default function ImageDemo() {
  const [imageError, setImageError] = useState(false)
  const imageSrc = '/uploads/streaming-icons/prueba-3-de-tipos-1761070230566.webp'
  const apiSrc = '/api/uploads/streaming-icons/prueba-3-de-tipos-1761070230566.webp'

  return (
    <div className="bg-gray-800 p-6 rounded-lg text-white">
      <h3 className="text-lg font-semibold mb-4">Image Loading Demo</h3>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Column 1: Direct img tags */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-400">Direct &lt;img&gt; Tags:</h4>
          
          <div className="border border-gray-600 p-3 rounded">
            <p className="text-xs text-gray-400 mb-2">Original Path (should fail):</p>
            <img
              src={imageSrc}
              alt="Original path"
              className="w-16 h-16 border border-red-500"
              onError={() => {
                console.error('Original path failed')
                setImageError(true)
              }}
              onLoad={() => {
                console.log('Original path loaded')
              }}
            />
            {imageError && <span className="text-red-400 text-xs">❌ Failed</span>}
          </div>

          <div className="border border-gray-600 p-3 rounded">
            <p className="text-xs text-gray-400 mb-2">API Endpoint (should work):</p>
            <img
              src={apiSrc}
              alt="API endpoint"
              className="w-16 h-16 border border-green-500"
              onError={() => {
                console.error('API endpoint failed')
              }}
              onLoad={() => {
                console.log('API endpoint loaded')
              }}
            />
          </div>
        </div>

        {/* Column 2: StreamingIcon component */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-400">StreamingIcon Component:</h4>
          
          <div className="border border-gray-600 p-3 rounded">
            <p className="text-xs text-gray-400 mb-2">Smart Component:</p>
            <div className="w-16 h-16 border border-blue-500 flex items-center justify-center">
              <StreamingIcon
                icon={imageSrc}
                name="Test Streaming"
                className="w-12 h-12"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-700 rounded">
        <p className="text-xs text-yellow-400">
          💡 Open browser console to see image loading logs
        </p>
      </div>
    </div>
  )
}