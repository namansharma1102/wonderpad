'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Plus, Loader2, Book } from 'lucide-react'
import UploadModal from '@/components/UploadModal'

interface BookData {
  id: string
  title: string
  status: string
  author?: string
  cover_path?: string
  progress?: {
    chapter_index: number
    scroll_percent: number
  } | null
}

interface LibraryClientProps {
  initialBooks: BookData[]
}

export default function LibraryClient({ initialBooks }: LibraryClientProps) {
  const [books, setBooks] = useState<BookData[]>(initialBooks)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  // Poll for any books that are currently 'processing' (legacy, in case any exist)
  const processingIdsRef = useRef<string[]>([])

  useEffect(() => {
    const processingBooks = books.filter((b) => b.status === 'processing')
    const processingIds = processingBooks.map((b) => b.id)

    // Only restart polling if the set of processing IDs actually changed
    if (JSON.stringify(processingIds) === JSON.stringify(processingIdsRef.current)) return
    processingIdsRef.current = processingIds

    if (processingIds.length === 0) return

    const interval = setInterval(() => {
      processingIds.forEach(async (bookId) => {
        try {
          const res = await fetch(`/api/books/${bookId}/status`)
          if (res.ok) {
            const data = await res.json()
            if (data.status !== 'processing') {
              setBooks((prev) =>
                prev.map((b) => (b.id === bookId ? { ...b, status: data.status, title: data.title } : b))
              )
            }
          }
        } catch (e) {
          console.error('Polling error', e)
        }
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [books])

  const handleUploadSuccess = (bookId: string) => {
    setIsUploadModalOpen(false)
    // New flow: book is already 'ready' when the server responds
    // Reload to get the full book data from the server
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#0b1c30] font-['Inter']">Your Library</h1>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 bg-[#E8690A] text-white px-5 py-2.5 rounded-full font-bold font-['Inter'] hover:bg-[#c05400] transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Upload Book
          </button>
        </div>

        {books.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-[#bec6e0] rounded-xl bg-[#ffffff]">
            <h2 className="text-xl font-semibold text-[#0b1c30] font-['Inter']">Your Library is empty</h2>
            <p className="mt-2 text-[#584237] font-['Inter']">Upload your first book to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {books.map((book) => {
              const coverUrl = book.cover_path 
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/books/${book.cover_path}`
                : null
              
              const isStarted = !!book.progress

              return (
                <div
                  key={book.id}
                  className="bg-[#ffffff] border border-[#e5eeff] rounded-2xl overflow-hidden shadow-sm hover:shadow-[0px_4px_20px_rgba(0,0,0,0.05)] transition-all flex h-48 md:h-56"
                >
                  {book.status === 'processing' ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-[#f8f9ff]">
                      <Loader2 className="w-8 h-8 animate-spin text-[#E8690A] mb-4" />
                      <p className="text-[#0b1c30] font-medium font-['Inter'] animate-pulse">Processing PDF...</p>
                    </div>
                  ) : book.status === 'failed' ? (
                    <div className="flex-1 flex flex-col items-center justify-center bg-[#ffdad6]">
                      <p className="text-[#93000a] font-medium font-['Inter']">Processing Failed</p>
                    </div>
                  ) : (
                    <div className="flex flex-1">
                      {/* Cover Image */}
                      <div className="w-1/3 bg-[#dae2fd] border-r border-[#e5eeff] relative overflow-hidden flex items-center justify-center shrink-0">
                        {coverUrl ? (
                          <img src={coverUrl} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <Book className="w-12 h-12 text-[#565e74]" />
                        )}
                      </div>
                      
                      {/* Book Details */}
                      <div className="w-2/3 p-5 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-[#0b1c30] text-lg leading-tight line-clamp-2 font-['Inter']" title={book.title}>
                            {book.title}
                          </h3>
                          {book.author && (
                            <p className="text-[#565e74] text-sm mt-1 font-['Inter'] truncate">
                              {book.author}
                            </p>
                          )}
                        </div>

                        <div className="mt-4">
                          {isStarted ? (
                            <div className="mb-3">
                              <div className="flex justify-between text-xs text-[#565e74] mb-1 font-['Inter'] font-medium">
                                <span>Chapter {book.progress!.chapter_index}</span>
                                <span>{Math.round(book.progress!.scroll_percent)}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-[#e5eeff] rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-[#E8690A]" 
                                  style={{ width: `${book.progress!.scroll_percent}%` }}
                                />
                              </div>
                            </div>
                          ) : null}

                          <button 
                            onClick={() => {
                              if (isStarted) {
                                window.location.href = `/read/${book.id}/${book.progress!.chapter_index}`
                              } else {
                                window.location.href = `/read/${book.id}/1`
                              }
                            }}
                            className="w-full bg-transparent border-2 border-[#8c7265] text-[#0b1c30] font-bold py-2 rounded-full hover:bg-[#f8f9ff] hover:border-[#0b1c30] transition-colors text-sm font-['Inter']"
                          >
                            {isStarted ? 'Continue Reading' : 'Start Reading'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  )
}
