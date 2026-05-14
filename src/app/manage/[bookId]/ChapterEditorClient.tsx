'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

interface Chapter {
  id: string
  index: number
  title: string
  content: string
}

interface ChapterEditorClientProps {
  book: any
  initialChapters: Chapter[]
}

export default function ChapterEditorClient({ book, initialChapters }: ChapterEditorClientProps) {
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters)
  const [isSaving, setIsSaving] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleTitleChange = (index: number, newTitle: string) => {
    const updated = [...chapters]
    updated[index].title = newTitle
    setChapters(updated)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      for (const chapter of chapters) {
        await supabase
          .from('chapters')
          .update({ title: chapter.title })
          .eq('id', chapter.id)
      }
    } catch (error) {
      console.error('Failed to save chapters:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-surface min-h-screen font-ui-body text-on-surface antialiased">
      {/* TopAppBar */}
      <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 fixed top-0 w-full z-50 h-16 flex justify-between items-center px-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/library"
            className="flex items-center justify-center w-10 h-10 text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="font-bold text-sm tracking-tight text-slate-900 truncate max-w-[200px]">
            {book.title}
          </h1>
        </div>
        <div>
          <Link 
            href={`/read/${book.id}/1`}
            className="bg-[#E8690A] hover:bg-[#c05400] text-white px-6 py-2 rounded-full font-bold text-[11px] uppercase tracking-widest transition-all active:scale-95 inline-block"
          >
            Start Reading
          </Link>
        </div>
      </header>

      <main className="pt-24 pb-32 px-4 max-w-[720px] mx-auto min-h-screen">
        {/* Header Section */}
        <section className="mb-10">
          <h2 className="font-display-lg text-[28px] font-bold text-on-surface mb-2">Review Chapters</h2>
          <p className="text-slate-500">We detected {chapters.length} chapters. Rename any chapter by tapping its title.</p>
        </section>

        {/* Chapter List */}
        <div className="border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-sm">
          {chapters.map((chapter, idx) => (
            <div 
              key={chapter.id}
              className={`flex items-center justify-between p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors group ${
                idx === 0 ? 'bg-orange-50/30' : ''
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">
                  {chapter.index}
                </div>
                <div className="flex items-center gap-2 flex-1 relative group">
                  <input 
                    className="bg-transparent border-none focus:ring-0 p-0 text-base font-semibold w-full text-on-surface"
                    type="text" 
                    value={chapter.title}
                    onChange={(e) => handleTitleChange(idx, e.target.value)}
                  />
                  <span className="material-symbols-outlined text-[#E8690A] text-base opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                  <div className="absolute bottom-0 left-0 w-full h-[1px] bg-slate-100 group-focus-within:bg-[#E8690A] group-focus-within:h-[2px] transition-all"></div>
                </div>
              </div>
              <div className="text-[10px] font-bold text-slate-300 ml-4 shrink-0 uppercase tracking-tighter">
                {Math.round(chapter.content.length / 5)} WORDS
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#E8690A] text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-orange-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <span className="material-symbols-outlined animate-spin">refresh</span>
            ) : (
              <span className="material-symbols-outlined">save</span>
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </main>

      {/* Mobile Sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-40 bg-white px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-4 border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <Link 
          href={`/read/${book.id}/1`}
          className="block text-center w-full bg-[#E8690A] text-white py-4 rounded-full font-bold text-base shadow-lg shadow-orange-500/20 active:scale-95 transition-transform"
        >
          Start Reading
        </Link>
      </div>
    </div>
  )
}
