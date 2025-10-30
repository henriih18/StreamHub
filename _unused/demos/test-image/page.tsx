'use client'

import { useState, useEffect } from 'react'
import StreamingIcon from '@/components/admin/streaming-icon'

export default function TestImagePage() {
  const [testData, setTestData] = useState<any>(null)

  useEffect(() => {
    // Fetch streaming accounts to get test data
    fetch('/api/streaming-accounts')
      .then(res => res.json())
      .then(data => {
        const testAccount = data.regularAccounts.find((acc: any) => acc.name === 'Test WebP')
        setTestData(testAccount)
      })
  }, [])

  if (!testData) {
    return <div className="min-h-screen bg-gray-900 text-white p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Image Display Test</h1>
      
      <div className="space-y-8">
        {/* Test Data Display */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Data</h2>
          <pre className="text-sm text-gray-300">
            {JSON.stringify(testData, null, 2)}
          </pre>
        </div>

        {/* Direct Image Test */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Direct Image Test</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">API Endpoint:</p>
              <img 
                src="/api/uploads/streaming-icons/prueba-3-de-tipos-1761070230566.webp"
                alt="Test via API"
                className="w-20 h-20 border border-red-500"
                onError={(e) => {
                  console.error('Direct API image failed:', e)
                  ;(e.target as HTMLImageElement).style.border = '2px solid red'
                }}
                onLoad={() => {
                  console.log('Direct API image loaded successfully')
                  ;(e.target as HTMLImageElement).style.border = '2px solid green'
                }}
              />
            </div>
            
            <div>
              <p className="text-sm text-gray-400 mb-2">Original Path:</p>
              <img 
                src="/uploads/streaming-icons/prueba-3-de-tipos-1761070230566.webp"
                alt="Test original path"
                className="w-20 h-20 border border-red-500"
                onError={(e) => {
                  console.error('Original path image failed:', e)
                  ;(e.target as HTMLImageElement).style.border = '2px solid red'
                }}
                onLoad={() => {
                  console.log('Original path image loaded successfully')
                  ;(e.target as HTMLImageElement).style.border = '2px solid green'
                }}
              />
            </div>
          </div>
        </div>

        {/* StreamingIcon Component Test */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">StreamingIcon Component Test</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">StreamingIcon Component:</p>
              <div className="w-20 h-20 border border-blue-500 flex items-center justify-center">
                <StreamingIcon 
                  icon={testData.streamingType?.icon}
                  name={testData.type}
                  className="w-16 h-16"
                />
              </div>
            </div>
          </div>
        </div>

        {/* StreamingCard Test */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">StreamingCard Test</h2>
          <p className="text-sm text-gray-400 mb-4">This should show the card with the WebP image:</p>
          {/* We'll import and use the actual StreamingCard component here */}
          <div className="text-sm text-yellow-400">
            Check the main page to see if the StreamingCard displays the image correctly.
          </div>
        </div>
      </div>
    </div>
  )
}