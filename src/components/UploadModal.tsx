'use client'

import React, { useState, useRef } from 'react'
import { UploadCloud, File, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess?: (bookId: string) => void
}

export default function UploadModal({ isOpen, onClose, onUploadSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  if (!isOpen) return null

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const validateFile = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.')
      return false
    }
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File size exceeds the 50MB limit.')
      return false
    }
    setError(null)
    return true
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/books/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setFile(null)
      if (onUploadSuccess) {
        onUploadSuccess(data.bookId)
      } else {
        router.refresh()
        onClose()
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during upload.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1c30]/40 backdrop-blur-sm p-4">
      <div className="bg-[#ffffff] rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] border border-[#E2E8F0] w-full max-w-md overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#e5eeff]">
          <h2 className="font-semibold text-[#0b1c30] text-lg font-['Inter']">Upload Book</h2>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-[#565e74] hover:bg-[#f8f9ff] p-2 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-[#E8690A] bg-[#fffbf8]'
                  : 'border-[#bec6e0] bg-[#f8f9ff] hover:border-[#E8690A] hover:bg-[#fffbf8]'
              }`}
            >
              <UploadCloud className={`w-12 h-12 mb-4 ${isDragging ? 'text-[#E8690A]' : 'text-[#8c7265]'}`} />
              <p className="text-[#0b1c30] font-medium mb-1 font-['Inter']">Click or drag and drop</p>
              <p className="text-[#584237] text-sm text-center font-['Inter']">
                PDF format only (Max 50MB)
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="application/pdf"
                className="hidden"
              />
            </div>
          ) : (
            <div className="border border-[#e5eeff] rounded-xl p-4 flex items-center bg-[#f8f9ff]">
              <div className="bg-[#dae2fd] p-3 rounded-lg mr-4">
                <File className="w-6 h-6 text-[#131b2e]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#0b1c30] font-medium truncate font-['Inter']">{file.name}</p>
                <p className="text-[#584237] text-sm font-['Inter']">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              {!isUploading && (
                <button
                  onClick={() => setFile(null)}
                  className="text-[#ba1a1a] p-2 hover:bg-[#ffdad6] rounded-full transition-colors ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-[#ffdad6] text-[#93000a] text-sm rounded-lg font-medium font-['Inter']">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f8f9ff] border-t border-[#e5eeff] flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 rounded-full border border-[#8c7265] text-[#0b1c30] hover:bg-[#eaf1ff] transition-colors font-semibold text-sm disabled:opacity-50 font-['Inter']"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="px-6 py-2 rounded-full bg-[#E8690A] text-white font-bold text-sm hover:bg-[#c05400] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-['Inter']"
          >
            {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isUploading ? 'Processing...' : 'Upload & Process'}
          </button>
        </div>
      </div>
    </div>
  )
}
