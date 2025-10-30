import { NextResponse } from 'next/server'

// Helper function to add compression headers to API responses
export function withCompression(response: NextResponse) {
  // Add compression headers
  response.headers.set('Content-Encoding', 'gzip')
  response.headers.set('Vary', 'Accept-Encoding')
  
  // Add cache control headers for better performance
  response.headers.set('Cache-Control', 'public, max-age=300') // 5 minutes
  
  return response
}

// Helper function to create optimized JSON responses
export function createJsonResponse(data: any, status: number = 200) {
  const response = NextResponse.json(data, { status })
  
  // Add optimization headers
  response.headers.set('Vary', 'Accept-Encoding')
  response.headers.set('Cache-Control', 'public, max-age=300')
  
  return response
}

// Helper function for static data responses (longer cache)
export function createStaticJsonResponse(data: any, status: number = 200) {
  const response = NextResponse.json(data, { status })
  
  // Longer cache for static data
  response.headers.set('Vary', 'Accept-Encoding')
  response.headers.set('Cache-Control', 'public, max-age=600') // 10 minutes
  
  return response
}

// Helper function for dynamic data responses (shorter cache)
export function createDynamicJsonResponse(data: any, status: number = 200) {
  const response = NextResponse.json(data, { status })
  
  // Shorter cache for dynamic data
  response.headers.set('Vary', 'Accept-Encoding')
  response.headers.set('Cache-Control', 'public, max-age=60') // 1 minute
  
  return response
}