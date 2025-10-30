"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

interface ImageUploadProps {
  value?: string
  onChange: (base64: string | undefined) => void
  className?: string
}

export default function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido')
      return
    }

    // Validate file size (max 1MB for now)
    if (file.size > 1 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 1MB')
      return
    }

    setIsUploading(true)

    try {
      const base64 = await convertToBase64(file)
      onChange(base64)
      toast.success('Imagen cargada correctamente')
    } catch (error) {
      toast.error('Error al cargar la imagen')
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        console.log('Base64 result:', result.substring(0, 100) + '...') // Debug log
        resolve(result)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const handleRemove = () => {
    onChange(undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    if (!value) {
      fileInputRef.current?.click()
    }
  }

  return (
    <Card className={`border-2 border-dashed transition-colors ${isDragging ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600'} ${className}`}>
      <CardContent className="p-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {value ? (
          <div className="relative group">
            <div 
              className="cursor-pointer"
              onClick={handleClick}
            >
              <img
                src={value}
                alt="Streaming type"
                className="w-full h-32 object-cover rounded-lg"
              />
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemove}
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="mt-2 text-center">
              <p className="text-sm text-slate-400">Click para cambiar la imagen</p>
            </div>
          </div>
        ) : (
          <div
            className="text-center cursor-pointer"
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                <p className="text-sm text-slate-400">Cargando...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                <div>
                  <p className="text-sm text-slate-300">
                    Arrastra una imagen aquí o click para seleccionar
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    PNG, JPG, GIF hasta 1MB
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}