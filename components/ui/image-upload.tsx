"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

interface ImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxFiles?: number
  disabled?: boolean
}

export default function ImageUpload({ value = [], onChange, maxFiles = 5, disabled = false }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  // Function to process image and maintain aspect ratio
  const processImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas not supported'))
        return
      }
      
      const img = document.createElement('img')
      
      img.onload = () => {
        try {
          // Standard dimensions for ecommerce (4:5 ratio)
          const targetWidth = 800
          const targetHeight = 1000
          
          // Calculate scaling to fit ENTIRE image within target dimensions
          // This ensures no part of the image is cropped
          const scaleX = targetWidth / img.width
          const scaleY = targetHeight / img.height
          const scale = Math.min(scaleX, scaleY) // Use smaller scale to fit completely
          
          const scaledWidth = img.width * scale
          const scaledHeight = img.height * scale
          
          // Set canvas to target dimensions
          canvas.width = targetWidth
          canvas.height = targetHeight
          
          // Fill with white background
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, targetWidth, targetHeight)
          
          // Center the scaled image
          const x = (targetWidth - scaledWidth) / 2
          const y = (targetHeight - scaledHeight) / 2
          
          // Draw the scaled image centered (entire image will be visible)
          ctx.drawImage(img, x, y, scaledWidth, scaledHeight)
          
          // Convert back to file
          canvas.toBlob((blob) => {
            if (blob) {
              const processedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              resolve(processedFile)
            } else {
              reject(new Error('Failed to process image'))
            }
          }, 'image/jpeg', 0.95)
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled) return

      const remainingSlots = maxFiles - value.length
      const filesToUpload = acceptedFiles.slice(0, remainingSlots)

      setUploading(true)

      try {
        const uploadPromises = filesToUpload.map(async (file) => {
          const formData = new FormData()
          formData.append("file", file)

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            throw new Error("Upload failed")
          }

          const data = await response.json()
          return data.url
        })

        const uploadedUrls = await Promise.all(uploadPromises)
        onChange([...value, ...uploadedUrls])
      } catch (error) {
        console.error("Upload error:", error)
      } finally {
        setUploading(false)
      }
    },
    [value, onChange, maxFiles, disabled],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: maxFiles - value.length,
    disabled: disabled || uploading,
  })

  const removeImage = (index: number) => {
    const newValue = value.filter((_, i) => i !== index)
    onChange(newValue)
  }

  return (
    <div className="space-y-4">
      {/* Uploaded Images */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {value.map((url, index) => (
            <Card key={index} className="relative group">
              <CardContent className="p-2">
                <div className="relative aspect-square bg-gray-50 rounded-md overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center p-2">
                    <Image
                      src={url || "/placeholder.svg"}
                      alt={`Upload ${index + 1}`}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {value.length < maxFiles && (
        <Card>
          <CardContent className="p-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? "border-gray-900 bg-gray-50" : "border-gray-300 hover:border-gray-900"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input {...getInputProps()} />

              <div className="flex flex-col items-center space-y-4">
                {uploading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gray-900" />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    {isDragActive ? (
                      <Upload className="h-6 w-6 text-gray-900" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-gray-900" />
                    )}
                  </div>
                )}

                <div>
                  <p className="text-lg font-medium">
                    {uploading ? "Uploading..." : isDragActive ? "Drop images here" : "Upload product images"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Drag & drop or click to select ({value.length}/{maxFiles})
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB each</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
