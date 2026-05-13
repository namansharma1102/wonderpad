'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import UploadModal from '@/components/UploadModal'

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
      {/* TopAppBar */}
      <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 docked full-width top-0 z-50 font-sans antialiased tracking-tight sticky">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-[#E8690A] cursor-pointer">menu</span>
            <span className="text-2xl font-black text-[#E8690A] tracking-tighter">Wonderpad</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a className="text-[#E8690A] font-semibold hover:text-[#E8690A] transition-colors" href="#">Library</a>
            <a className="text-slate-600 dark:text-slate-400 hover:text-[#E8690A] transition-colors" href="#">Discover</a>
            <a className="text-slate-600 dark:text-slate-400 hover:text-[#E8690A] transition-colors" href="#">Stats</a>
            <a className="text-slate-600 dark:text-slate-400 hover:text-[#E8690A] transition-colors" href="/settings">Settings</a>
          </div>
          <div className="flex items-center gap-3">
            <div 
              onClick={() => router.push('/settings')}
              className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden cursor-pointer active:opacity-70 transition-opacity"
            >
              <span className="text-[#E8690A] font-bold text-sm">JS</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Title & Upload Button */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="font-display-lg text-[28px] font-bold text-on-surface mb-2">My Library</h1>
            <p className="text-secondary font-ui-body">Continue where you left off in your literary journey.</p>
          </div>
          <button 
            onClick={() => setShowUpload(true)}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-[#E8690A] text-white font-bold rounded-full shadow-lg shadow-orange-500/20 hover:bg-[#c05400] transition-all active:scale-95 group"
          >
            <span className="material-symbols-outlined">add</span>
            <span>Upload a Book</span>
          </button>
        </div>

        {/* Upload Zone */}
        <section className="mb-16">
          <div className="relative group cursor-pointer" onClick={() => setShowUpload(true)}>
            <div className="absolute -inset-1 bg-gradient-to-r from-[#E8690A] to-orange-300 rounded-lg blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
            <div className="relative flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed border-outline-variant bg-white rounded-lg transition-colors hover:border-[#E8690A]/50">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[#E8690A] text-3xl">cloud_upload</span>
              </div>
              <p className="text-on-surface font-semibold text-lg mb-1">Drag and drop your files here</p>
              <p className="text-secondary text-sm">Supports PDF, EPUB, and MOBI (Max 50MB)</p>
            </div>
          </div>
        </section>

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
                  <div 
                    key={book.id} 
                    className="group cursor-pointer"
                    onClick={() => {
                      const chapterIdx = book.progress?.chapter_index || 1
                      router.push(`/read/${book.id}/${chapterIdx}`)
                    }}
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
                          <span className="material-symbols-outlined text-[#E8690A] text-4xl mb-2">menu_book</span>
                          <span className="text-xs text-center font-semibold text-[#E8690A]/70 line-clamp-3">{book.title}</span>
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
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>

      {/* Bottom Nav Bar (mobile) */}
      <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-3 pb-safe md:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-50">
        <div className="flex flex-col items-center justify-center text-[#E8690A] bg-orange-50 dark:bg-orange-950/30 rounded-full px-4 py-1 transition-transform active:scale-90">
          <span className="material-symbols-outlined">library_books</span>
          <span className="text-[10px] uppercase font-bold tracking-widest font-sans">Library</span>
        </div>
        <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-transform active:scale-90">
          <span className="material-symbols-outlined">explore</span>
          <span className="text-[10px] uppercase font-bold tracking-widest font-sans">Discover</span>
        </div>
        <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-transform active:scale-90">
          <span className="material-symbols-outlined">bar_chart</span>
          <span className="text-[10px] uppercase font-bold tracking-widest font-sans">Stats</span>
        </div>
        <div 
          onClick={() => router.push('/settings')}
          className="flex flex-col items-center justify-center text-[#E8690A] transition-transform active:scale-90 cursor-pointer"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
          <span className="text-[10px] uppercase font-bold tracking-widest font-sans">Settings</span>
        </div>
      </nav>

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
