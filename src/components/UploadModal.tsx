'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { processClientPdf } from '@/lib/clientPdfProcessor'
import { motion, AnimatePresence } from 'framer-motion'

interface UploadModalProps {
  onClose: () => void
  onUploadComplete: () => void
}

type Stage = 'idle' | 'extracting' | 'uploading' | 'done' | 'error'

export default function UploadModal({ onClose, onUploadComplete }: UploadModalProps) {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [progress, setProgress] = useState('')
  const [percent, setPercent] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf') {
      setErrorMsg('Only PDF files are supported.')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('File size exceeds 50MB limit.')
      return
    }
    setSelectedFile(file)
    setErrorMsg('')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      // Step 1: Extract chapters client-side
      setStage('extracting')
      setProgress('Reading PDF pages...')
      setPercent(10)

      const result = await processClientPdf(selectedFile)
      setPercent(40)
      setProgress(`Found ${result.chapters.length} chapters`)

      // Step 2: Upload file + chapters to server
      setStage('uploading')
      setProgress('Saving to cloud...')
      setPercent(60)

      const payload = {
        filename: selectedFile.name,
        chapters: result.chapters,
        author: result.author,
        title: result.title
      }

      const response = await fetch('/api/books/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setPercent(100)
      setStage('done')
      setProgress('Book ready!')

      setTimeout(() => {
        router.push(`/manage/${data.bookId}`)
        onUploadComplete()
      }, 1500)
    } catch (err: any) {
      setStage('error')
      setErrorMsg(err.message || 'Something went wrong')
    }
  }

  const isProcessing = stage === 'extracting' || stage === 'uploading'

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/10 backdrop-blur-md" 
          onClick={isProcessing ? undefined : onClose} 
        />

        {stage === 'idle' || stage === 'error' ? (
          /* Upload Modal View */
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100"
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-4 flex justify-between items-center">
              <h2 className="font-headline-md text-headline-md text-on-surface">Upload a Book</h2>
              <button 
                onClick={onClose} 
                className="p-2 rounded-full hover:bg-slate-50 transition-colors text-slate-400"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="px-8 pb-4">
              {!selectedFile ? (
                /* Drop zone */
                <div
                  className={`relative bg-[#F9FAFB] hover:bg-slate-50 transition-colors cursor-pointer group rounded-2xl border-2 border-dashed ${
                    isDragging ? 'border-[#E8690A] bg-orange-50/50' : 'border-slate-200'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-6 border border-slate-100 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-slate-400 text-3xl">upload_file</span>
                    </div>
                    <div className="space-y-1">
                      <p className="font-ui-body text-slate-600">Drag your PDF here</p>
                      <p className="font-ui-body text-slate-400">
                        or <span className="text-[#E8690A] font-semibold">click to browse</span>
                      </p>
                    </div>
                    {/* Decorative Visual */}
                    <div className="mt-12">
                      <div className="relative w-40 h-52 bg-white rounded-lg border border-slate-100 shadow-sm p-4 overflow-hidden opacity-40">
                        <div className="w-full h-24 bg-slate-100 rounded-sm mb-4"></div>
                        <div className="h-2 w-full bg-slate-50 rounded-full mb-2"></div>
                        <div className="h-2 w-3/4 bg-slate-50 rounded-full mb-2"></div>
                        <div className="h-2 w-1/2 bg-slate-50 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* File selected View */
                <div className="flex flex-col items-center py-12">
                  <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-[#E8690A] text-4xl">description</span>
                  </div>
                  <h3 className="font-bold text-on-surface text-xl mb-1 text-center truncate w-full px-4">{selectedFile.name}</h3>
                  <p className="text-secondary text-sm mb-6">
                    {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB • PDF Document
                  </p>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-sm font-semibold text-slate-400 hover:text-[#E8690A] transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">restart_alt</span>
                    Choose a different file
                  </button>
                </div>
              )}

              {errorMsg && (
                <div className="mt-4 p-3 bg-error-container text-on-error-container rounded-lg text-sm font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">error</span>
                  {errorMsg}
                </div>
              )}

              <p className="mt-4 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                50MB MAXIMUM • PDF ONLY
              </p>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-slate-50/50 flex items-center justify-end gap-6">
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-on-surface font-bold text-[11px] uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile}
                className={`px-10 py-4 rounded-full font-bold text-[11px] uppercase tracking-widest transition-all ${
                  selectedFile 
                    ? 'bg-[#E8690A] text-white hover:bg-[#c05400] shadow-lg shadow-orange-500/20 active:scale-95'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-80'
                }`}
              >
                Upload & Process
              </button>
            </div>
          </motion.div>
        ) : (
          /* Processing Full Screen View */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-[70] flex flex-col items-center justify-center p-8 text-center"
          >
            {/* Top Branding */}
            <div className="absolute top-12">
              <span className="text-2xl font-black text-[#E8690A] tracking-tighter">Wonderpad</span>
            </div>

            {/* Central Spinner */}
            <div className="relative flex items-center justify-center mb-12">
              <svg className="w-56 h-56 md:w-72 md:h-72">
                <circle 
                  className="text-slate-100" 
                  cx="50%" cy="50%" r="90" 
                  fill="transparent" stroke="currentColor" strokeWidth="4"
                  style={{ r: 'clamp(80px, 18vw, 100px)' }}
                />
                <motion.circle 
                  className="text-[#E8690A]" 
                  cx="50%" cy="50%" r="90" 
                  fill="transparent" stroke="currentColor" strokeWidth="4" 
                  strokeDasharray="200 400" strokeLinecap="round"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  style={{ r: 'clamp(80px, 18vw, 100px)', transformOrigin: 'center' }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-5xl text-slate-300">
                  {stage === 'done' ? 'check_circle' : 'import_contacts'}
                </span>
              </div>
            </div>

            {/* Metadata & Status */}
            <div className="space-y-4 max-w-md w-full">
              <h1 className="font-headline-md text-2xl font-bold text-on-surface truncate w-full">
                {selectedFile?.name}
              </h1>
              <p className="font-label-sm text-sm text-slate-400 uppercase tracking-widest animate-pulse">
                {progress}
              </p>
            </div>

            {/* Progress Bar Footer */}
            <div className="mt-16 w-64 space-y-3">
              <div className="flex justify-between items-center text-[11px] font-black text-slate-300 uppercase tracking-tighter">
                <span>PROGRESS</span>
                <span className="text-[#E8690A]">{Math.round(percent)}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-[#E8690A]"
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                />
              </div>
            </div>

          </motion.div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFileSelect(file)
          }}
          className="hidden"
        />
      </div>
    </AnimatePresence>
  )
}
