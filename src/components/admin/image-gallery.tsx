"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Image as ImageIcon, Trash2, Download, Eye } from 'lucide-react'
import { toast } from 'sonner'

interface SavedImage {
  id: string
  name: string
  data: string // base64 data
  createdAt: string
  size: number
}

interface ImageGalleryProps {
  onSelectImage: (base64: string) => void
  currentImage?: string
}

export default function ImageGallery({ onSelectImage, currentImage }: ImageGalleryProps) {
  const [savedImages, setSavedImages] = useState<SavedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState<SavedImage | null>(null)

  useEffect(() => {
    loadSavedImages()
  }, [])

  const loadSavedImages = () => {
    try {
      const stored = localStorage.getItem('streaming-type-images')
      if (stored) {
        const images = JSON.parse(stored)
        setSavedImages(images)
      }
    } catch (error) {
      console.error('Error loading images:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveImage = (base64: string, name: string) => {
    try {
      // Optimize the image before saving
      optimizeImageForGallery(base64).then(optimizedBase64 => {
        const newImage: SavedImage = {
          id: Date.now().toString(),
          name,
          data: optimizedBase64,
          createdAt: new Date().toISOString(),
          size: Math.round(optimizedBase64.length * 0.75 / 1024) // Approximate size in KB
        }

        const updatedImages = [...savedImages, newImage]
        setSavedImages(updatedImages)
        localStorage.setItem('streaming-type-images', JSON.stringify(updatedImages))
        toast.success('Imagen guardada en la galería')
      }).catch(error => {
        toast.error('Error al optimizar la imagen')
        console.error('Optimization error:', error)
      })
    } catch (error) {
      toast.error('Error al guardar la imagen')
      console.error('Save error:', error)
    }
  }

  const optimizeImageForGallery = (base64: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      img.onload = () => {
        // Calculate new dimensions (max 300x300 for gallery)
        const maxSize = 300
        let { width, height } = img

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height)
        
        // Convert to base64 with reduced quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
        resolve(dataUrl)
      }

      img.onerror = reject
      img.src = base64
    })
  }

  const deleteImage = (id: string) => {
    try {
      const updatedImages = savedImages.filter(img => img.id !== id)
      setSavedImages(updatedImages)
      localStorage.setItem('streaming-type-images', JSON.stringify(updatedImages))
      toast.success('Imagen eliminada')
    } catch (error) {
      toast.error('Error al eliminar la imagen')
      console.error('Delete error:', error)
    }
  }

  const downloadImage = (image: SavedImage) => {
    try {
      const link = document.createElement('a')
      link.href = image.data
      link.download = `${image.name}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Imagen descargada')
    } catch (error) {
      toast.error('Error al descargar la imagen')
      console.error('Download error:', error)
    }
  }

  const formatFileSize = (kb: number) => {
    if (kb < 1024) return `${kb} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <ImageIcon className="w-4 h-4 mr-2" />
          Galería de Imágenes
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-white">Galería de Imágenes</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {currentImage && (
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-sm text-slate-300">Imagen Actual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <img
                    src={currentImage}
                    alt="Current"
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-slate-400">Imagen seleccionada actualmente</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                <p className="text-sm text-slate-400 mt-2">Cargando imágenes...</p>
              </div>
            ) : savedImages.length === 0 ? (
              <div className="text-center py-8">
                <ImageIcon className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No hay imágenes guardadas</p>
                <p className="text-sm text-slate-500 mt-1">
                  Las imágenes que subas se guardarán automáticamente aquí
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedImages.map((image) => (
                  <Card key={image.id} className="bg-slate-700 border-slate-600 group hover:bg-slate-600 transition-colors">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="relative">
                          <img
                            src={image.data}
                            alt={image.name}
                            className="w-full h-32 object-cover rounded cursor-pointer"
                            onClick={() => setPreviewImage(image)}
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center space-x-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setPreviewImage(image)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => onSelectImage(image.data)}
                            >
                              Seleccionar
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-white truncate">
                              {image.name}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              {formatFileSize(image.size)}
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-slate-400">
                            {formatDate(image.createdAt)}
                          </p>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onSelectImage(image.data)}
                              className="flex-1 border-emerald-600 text-emerald-400 hover:bg-emerald-600 hover:text-white"
                            >
                              Usar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadImage(image)}
                              className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteImage(image.id)}
                              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Preview Dialog */}
        {previewImage && (
          <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">{previewImage.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <img
                  src={previewImage.data}
                  alt={previewImage.name}
                  className="w-full max-h-96 object-contain rounded"
                />
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Tamaño: {formatFileSize(previewImage.size)}</span>
                  <span>Creada: {formatDate(previewImage.createdAt)}</span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => {
                      onSelectImage(previewImage.data)
                      setPreviewImage(null)
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    Seleccionar esta imagen
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPreviewImage(null)}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}