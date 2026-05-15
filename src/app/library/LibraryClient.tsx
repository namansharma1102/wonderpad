'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import UploadModal from '@/components/UploadModal'
import Navigation from '@/components/Navigation'

interface BookData {
  id: string
  title: string
  status: string
  author?: string
  cover_url?: string
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
  const [showUpload, setShowUpload] = useState(false)
  const router = useRouter()

  const handleUploadComplete = useCallback(() => {
    setShowUpload(false)
    router.refresh()
  }, [router])

  const readyBooks = books.filter((b) => b.status === 'ready')

  return (
    <div className="bg-background font-ui-body text-on-background min-h-screen pb-24 md:pb-0">
      <Navigation />

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Title & Upload Button */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="font-display-lg text-[28px] font-bold text-on-surface mb-2">My Library</h1>
            <p className="text-secondary font-ui-body">Continue where you left off in your literary journey.</p>
          </div>
        </div>



        {/* Book Grid or Empty State */}
        {readyBooks.length === 0 ? (
          <section className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-48 h-48 mb-8">
              <img 
                className="w-full h-full object-contain" 
                alt="Empty library illustration"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCy035I2XPs0v2Qx5ey5jAiuucA-606zrOlDP_pw8nmNCeqguSpn3RUDS5lELQKSBqp_ucdlU058fhUq44mjxiyX4j0v6VnGmLXiX7rPdHQ-mRDrWcm9UE6EM1zgxMlrtl1EgIVbNChMALimvCzPOhZDeTSkNh7OKPF-on4dtRBKjfMX2BO4ijrvkZV0rb-cDyxngctV2XHYghmM9XRnWQt_amPJEzR_gHiO7etsVnDIDdbadzPyNZhO67IdhArTmvvNyYPxcFjiwU" 
              />
            </div>
            <h2 className="font-headline-md text-2xl font-bold text-on-surface mb-2">Your library is empty</h2>
            <p className="text-secondary mb-8 max-w-md">Upload your first PDF or EPUB to start building your personal sanctuary of knowledge.</p>
            <button 
              onClick={() => setShowUpload(true)}
              className="px-10 py-4 bg-[#E8690A] text-white font-bold rounded-full hover:bg-[#c05400] transition-all"
            >
              Upload Your First Book
            </button>
          </section>
        ) : (
          <section>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-6 gap-y-10">
              {readyBooks.map((book) => {
                const progressPct = book.progress
                  ? Math.round((book.progress.chapter_index / 20) * 100) // Approximate
                  : 0

                return (
                  <Link 
                    key={book.id} 
                    href={`/read/${book.id}/${book.progress?.chapter_index || 1}`}
                    className="group cursor-pointer block"
                  >
                    <div className="relative aspect-[2/3] mb-4 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-sm transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl">
                      {book.cover_url ? (
                        <img 
                          className="w-full h-full object-cover" 
                          alt={book.title} 
                          src={book.cover_url}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-50 flex flex-col items-center justify-center p-4">
                          <img src="/logo.png" alt="Wonderpad Logo" className="w-16 h-16 object-contain mb-4 drop-shadow-md mix-blend-multiply opacity-80" />
                          <span className="text-sm text-center font-bold text-slate-700 line-clamp-3 leading-snug px-2">{book.title}</span>
                        </div>
                      )}
                      
                      {/* Manage Button on Hover */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/manage/${book.id}`)
                        }}
                        className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-slate-400 hover:text-[#E8690A] opacity-0 group-hover:opacity-100 transition-all active:scale-90 z-10"
                      >
                        <span className="material-symbols-outlined text-base">settings</span>
                      </div>

                      <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-200">
                        <div 
                          className="h-full bg-[#E8690A] progress-bar-glow" 
                          style={{ width: `${book.progress ? Math.max(progressPct, 5) : 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-headline-md text-base font-bold text-on-surface truncate">{book.title}</h3>
                      <p className="text-secondary text-sm truncate">{book.author || 'Unknown Author'}</p>
                      <span className="inline-block text-[10px] font-bold text-[#E8690A] bg-orange-50 px-2 py-0.5 rounded">
                        {book.progress ? `${progressPct}% READ` : 'NEW'}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </main>

      {/* Floating Action Button for Upload */}
      <button
        onClick={() => setShowUpload(true)}
        className="fixed bottom-24 right-6 md:bottom-12 md:right-12 w-16 h-16 bg-[#E8690A] text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-[#c05400] hover:scale-105 active:scale-95 transition-all z-40 group"
      >
        <span className="material-symbols-outlined text-3xl transition-transform group-hover:rotate-90">add</span>
      </button>

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </div>
  )
}
