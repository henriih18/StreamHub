"use client"

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

interface ImageUploadFileProps {
  value?: File | null
  onChange: (file: File | null) => void
  className?: string
}

export default function ImageUploadFile({ value, onChange, className }: ImageUploadFileProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido')
      return
    }

    // Validate file size (max 5MB para WebP)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB')
      return
    }

    setIsUploading(true)

    try {
      console.log('Archivo seleccionado:', file.name, file.type, file.size)
      onChange(file)
      toast.success('Imagen cargada correctamente')
    } catch (error) {
      toast.error('Error al cargar la imagen')
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
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
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    if (!value) {
      fileInputRef.current?.click()
    }
  }

  const createPreviewUrl = (file: File) => {
    return URL.createObjectURL(file)
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
                src={createPreviewUrl(value)}
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
              <p className="text-sm text-slate-400">{value.name}</p>
              <p className="text-xs text-slate-500">Click para cambiar la imagen</p>
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
                    PNG, JPG, GIF hasta 5MB (se convertirá a WebP)
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