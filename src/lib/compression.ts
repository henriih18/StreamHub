import { NextResponse } from "next/server";

// Función auxiliar para agregar encabezados de compresión a las respuestas de API
export function withCompression(response: NextResponse) {
  // Agregar encabezados de compresión
  response.headers.set("Content-Encoding", "gzip");
  response.headers.set("Vary", "Accept-Encoding");

  // Agregar encabezados de control de caché para un mejor rendimiento
  response.headers.set("Cache-Control", "public, max-age=300"); // 5 minutos

  return response;
}

// Función auxiliar para crear respuestas JSON optimizadas
export function createJsonResponse(data: any, status: number = 200) {
  const response = NextResponse.json(data, { status });

  // Add optimization headers
  response.headers.set("Vary", "Accept-Encoding");
  response.headers.set("Cache-Control", "public, max-age=300");

  return response;
}

// Función auxiliar para respuestas de datos estáticos (caché más largo)
export function createStaticJsonResponse(data: any, status: number = 200) {
  const response = NextResponse.json(data, { status });

  // Longer cache for static data
  response.headers.set("Vary", "Accept-Encoding");
  response.headers.set("Cache-Control", "public, max-age=600"); // 10 minutos

  return response;
}

// Función auxiliar para respuestas de datos dinámicos (caché más corto)
export function createDynamicJsonResponse(data: any, status: number = 200) {
  const response = NextResponse.json(data, { status });

  // Caché más corta para datos dinámicos
  response.headers.set("Vary", "Accept-Encoding");
  response.headers.set("Cache-Control", "public, max-age=60"); // 1 minuto

  return response;
}
