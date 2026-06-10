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

function BookCard({ book, onOpenMenu, router }: { book: BookData; onOpenMenu: (b: BookData) => void; router: any }) {
  const [isPressing, setIsPressing] = useState(false)
  const pressTimer = React.useRef<NodeJS.Timeout | null>(null)

  const progressPct = book.progress
    ? Math.round((book.progress.chapter_index / 20) * 100) // Approximate
    : 0

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only handle primary button (left click or touch)
    if (e.button !== 0) return
    setIsPressing(true)
    pressTimer.current = setTimeout(() => {
      onOpenMenu(book)
      setIsPressing(false)
    }, 800) // 800ms long press
  }

  const handlePointerUpOrLeave = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
    setIsPressing(false)
  }

  const handleClick = (e: React.MouseEvent) => {
    // If the long press already fired, we shouldn't navigate
    if (!pressTimer.current && isPressing) {
      e.preventDefault()
    }
  }

  return (
    <Link 
      href={`/read/${book.id}/${book.progress?.chapter_index || 1}`}
      className={`group cursor-pointer block transition-transform duration-200 ${isPressing ? 'scale-95' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUpOrLeave}
      onPointerLeave={handlePointerUpOrLeave}
      onPointerCancel={handlePointerUpOrLeave}
      onClick={handleClick}
      // Prevent context menu on touch devices
      onContextMenu={(e) => {
        // Only prevent on touch to allow right click on desktop
        if ((e.nativeEvent as any).pointerType === 'touch') {
          e.preventDefault()
        }
      }}
    >
      <div className="relative aspect-[2/3] mb-4 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-sm transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl">
        {book.cover_url ? (
          <img 
            className="w-full h-full object-cover select-none pointer-events-none" 
            alt={book.title} 
            src={book.cover_url}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-50 flex flex-col items-center justify-center p-4 select-none pointer-events-none">
            <img src="/logo.png" alt="Wonderpad Logo" className="w-16 h-16 object-contain mb-4 drop-shadow-md mix-blend-multiply opacity-80" />
            <span className="text-sm text-center font-bold text-slate-700 line-clamp-3 leading-snug px-2">{book.title}</span>
          </div>
        )}
        
        {/* Manage Button on Hover (Desktop) */}
        <div 
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onOpenMenu(book)
          }}
          className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-slate-400 hover:text-[#E8690A] opacity-0 group-hover:opacity-100 transition-all active:scale-90 z-10 hidden md:block"
        >
          <span className="material-symbols-outlined text-base">more_vert</span>
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
}


export default function LibraryClient({ initialBooks }: LibraryClientProps) {
  const [books, setBooks] = useState<BookData[]>(initialBooks)
  const [showUpload, setShowUpload] = useState(false)
  const [activeMenuBook, setActiveMenuBook] = useState<BookData | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleUploadComplete = useCallback(() => {
    setShowUpload(false)
    router.refresh()
  }, [router])

  const handleDeleteBook = async () => {
    if (!activeMenuBook) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/books/${activeMenuBook.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete book')
      setBooks((prev) => prev.filter((b) => b.id !== activeMenuBook.id))
      setActiveMenuBook(null)
      router.refresh()
    } catch (e) {
      console.error(e)
      alert('Failed to delete book')
    } finally {
      setIsDeleting(false)
    }
  }

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
              {readyBooks.map((book) => (
                <BookCard 
                  key={book.id} 
                  book={book} 
                  onOpenMenu={setActiveMenuBook} 
                  router={router} 
                />
              ))}
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

      {/* Book Context Menu Modal */}
      {activeMenuBook && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pb-8 sm:p-0">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setActiveMenuBook(null)}
          ></div>
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex gap-4 items-center">
              <div className="w-12 h-16 bg-slate-100 rounded overflow-hidden shadow-sm shrink-0">
                {activeMenuBook.cover_url ? (
                  <img src={activeMenuBook.cover_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full bg-orange-50 flex items-center justify-center">
                    <span className="material-symbols-outlined text-orange-200">book</span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 truncate">{activeMenuBook.title}</h3>
                <p className="text-xs text-slate-500 truncate">{activeMenuBook.author || 'Unknown Author'}</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="p-2 flex flex-col">
              <button 
                onClick={() => router.push(`/manage/${activeMenuBook.id}`)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors text-left font-medium text-slate-700"
              >
                <span className="material-symbols-outlined text-slate-400">info</span>
                Read story info
              </button>
              
              <button 
                onClick={handleDeleteBook}
                disabled={isDeleting}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors text-left font-medium text-red-600 disabled:opacity-50"
              >
                <span className="material-symbols-outlined">delete</span>
                {isDeleting ? 'Removing...' : 'Remove from library'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
