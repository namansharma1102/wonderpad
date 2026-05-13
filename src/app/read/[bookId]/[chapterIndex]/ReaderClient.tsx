'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface ChapterData {
  index: number
  title: string
  content: string
}

interface ChapterMeta {
  index: number
  title: string
}

interface ReaderClientProps {
  bookId: string
  bookTitle: string
  currentChapter: ChapterData
  allChapters: ChapterMeta[]
  totalChapters: number
  initialScrollPercent?: number
}

// Default settings
const DEFAULT_THEME = 'white'
const DEFAULT_FONT = 'serif'
const DEFAULT_SIZE = 20

export default function ReaderClient({
  bookId,
  bookTitle,
  currentChapter,
  allChapters,
  totalChapters,
  initialScrollPercent = 0,
}: ReaderClientProps) {
  const router = useRouter()

  // UI state
  const [showBars, setShowBars] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)

  // Reader settings state
  const [theme, setTheme] = useState<'white' | 'sepia' | 'dark'>(DEFAULT_THEME)
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>(DEFAULT_FONT)
  const [fontSize, setFontSize] = useState(DEFAULT_SIZE)
  const [scrollProgress, setScrollProgress] = useState(0)

  const contentRef = useRef<HTMLDivElement>(null)
  const scrollPercentRef = useRef<number>(initialScrollPercent)

  // Load settings
  useEffect(() => {
    const saved = localStorage.getItem('wonderpad_reader_settings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.theme) setTheme(parsed.theme)
        if (parsed.fontFamily) setFontFamily(parsed.fontFamily)
        if (parsed.fontSize) setFontSize(parsed.fontSize)
      } catch (e) { console.error(e) }
    }
  }, [])

  // Save settings
  useEffect(() => {
    localStorage.setItem('wonderpad_reader_settings', JSON.stringify({ theme, fontFamily, fontSize }))
    
    // Update theme specific CSS variables
    const root = document.documentElement
    if (theme === 'dark') {
      root.style.setProperty('--reader-bg', '#1A1A1A')
      root.style.setProperty('--reader-text', '#E0E0E0')
      root.style.setProperty('--reader-ui-bg', '#141414')
      root.style.setProperty('--reader-border', 'rgba(255,255,255,0.1)')
    } else if (theme === 'sepia') {
      root.style.setProperty('--reader-bg', '#F5ECD7')
      root.style.setProperty('--reader-text', '#5C4A1E')
      root.style.setProperty('--reader-ui-bg', '#EBE2CD')
      root.style.setProperty('--reader-border', 'rgba(92,74,30,0.1)')
    } else {
      root.style.setProperty('--reader-bg', '#f8f9ff')
      root.style.setProperty('--reader-text', '#0b1c30')
      root.style.setProperty('--reader-ui-bg', '#ffffff')
      root.style.setProperty('--reader-border', '#e2e8f0')
    }
  }, [theme, fontFamily, fontSize])

  // Progress Tracking
  const saveProgress = async () => {
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book_id: bookId,
          chapter_index: currentChapter.index,
          scroll_percent: scrollPercentRef.current,
        }),
      })
    } catch (e) { console.error(e) }
  }

  useEffect(() => {
    const el = contentRef.current
    if (el && initialScrollPercent > 0) {
      setTimeout(() => {
        const scrollable = el.scrollHeight - el.clientHeight
        el.scrollTop = (initialScrollPercent / 100) * scrollable
      }, 100)
    }
    const intervalId = setInterval(saveProgress, 15000)
    return () => {
      clearInterval(intervalId)
      saveProgress()
    }
  }, [bookId, currentChapter.index])

  const handleScroll = () => {
    const el = contentRef.current
    if (!el) return
    const scrollable = el.scrollHeight - el.clientHeight
    const pct = scrollable > 0 ? (el.scrollTop / scrollable) * 100 : 0
    const finalPct = Math.min(100, Math.max(0, pct))
    scrollPercentRef.current = finalPct
    setScrollProgress(finalPct)
  }

  const toggleBars = () => {
    if (showSettings || showDrawer) {
      setShowSettings(false)
      setShowDrawer(false)
      return
    }
    setShowBars(!showBars)
  }

  const navigateChapter = (newIndex: number) => {
    if (newIndex < 1 || newIndex > totalChapters) return
    router.push(`/read/${bookId}/${newIndex}`)
  }

  const overallProgress = Math.round(((currentChapter.index - 1 + (scrollProgress / 100)) / totalChapters) * 100)
  const lineWeight = theme === 'sepia' ? '1.75' : '1.6'

  return (
    <div 
      className="fixed inset-0 flex flex-col transition-colors duration-500 selection:bg-[#E8690A]/30 overflow-hidden"
      style={{ backgroundColor: 'var(--reader-bg)', color: 'var(--reader-text)' }}
    >
      {/* Top Reading Progress Indicator */}
      <div className="fixed top-0 left-0 w-full h-[2px] bg-black/10 z-[60]">
        <motion.div 
          className="h-full bg-[#E8690A] shadow-[0_0_8px_rgba(232,105,10,0.5)]" 
          initial={{ width: 0 }}
          animate={{ width: `${overallProgress}%` }}
        />
      </div>

      {/* Top Bar */}
      <AnimatePresence>
        {showBars && (
          <motion.header
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            className="fixed top-0 left-0 w-full z-50 backdrop-blur-md border-b h-16 px-4 flex justify-between items-center"
            style={{ backgroundColor: 'var(--reader-ui-bg)', borderColor: 'var(--reader-border)', opacity: 0.95 }}
          >
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/library')}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <h1 className="text-sm font-bold tracking-tight truncate max-w-[180px]">{bookTitle}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => router.push('/settings')}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined">settings</span>
              </button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Reading Canvas */}
      <main 
        ref={contentRef}
        onScroll={handleScroll}
        onClick={toggleBars}
        className="flex-1 overflow-y-auto cursor-pointer pt-24 pb-40 px-6 max-w-reader-width mx-auto scroll-smooth"
      >
        <article 
          className={`${fontFamily === 'serif' ? 'font-reader-body' : 'font-ui-body'}`}
          style={{ fontSize: `${fontSize}px`, lineHeight: lineWeight }}
        >
          <header className="mb-16 text-center py-12">
            <p className="text-[11px] font-black uppercase tracking-[0.3em] opacity-40 mb-4">Chapter {currentChapter.index}</p>
            <h2 className="text-3xl font-bold italic">{currentChapter.title}</h2>
            <div className="w-12 h-[1px] bg-current opacity-20 mx-auto mt-8"></div>
          </header>

          <div 
            className="reader-content text-justify space-y-8"
            dangerouslySetInnerHTML={{ __html: currentChapter.content.replace(/\n/g, '<br/>') }}
          />
          
          <footer className="mt-24 pt-8 border-t flex justify-between items-center opacity-30 text-[10px] font-bold uppercase tracking-widest" style={{ borderColor: 'var(--reader-border)' }}>
            <span>PROGRESS: {Math.round(overallProgress)}%</span>
            <span>Wonderpad Reader</span>
          </footer>
        </article>
      </main>

      {/* Bottom Bar */}
      <AnimatePresence>
        {showBars && (
          <motion.footer
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed bottom-0 left-0 w-full z-50 backdrop-blur-md border-t pb-safe"
            style={{ backgroundColor: 'var(--reader-ui-bg)', borderColor: 'var(--reader-border)', opacity: 0.98 }}
          >
            <div className="max-w-reader-width mx-auto px-6 h-36 flex flex-col justify-center gap-6">
              {/* Progress Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black opacity-40 tracking-widest uppercase">
                  <span>{Math.round(scrollProgress)}% CHAPTER COMPLETE</span>
                  <span>CHAPTER {currentChapter.index} OF {totalChapters}</span>
                </div>
                <div className="relative w-full h-8 flex items-center group">
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={scrollProgress}
                    onChange={(e) => {
                      const pct = parseInt(e.target.value)
                      if (contentRef.current) {
                        const scrollable = contentRef.current.scrollHeight - contentRef.current.clientHeight
                        contentRef.current.scrollTop = (pct / 100) * scrollable
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full h-[3px] bg-black/10 rounded-full appearance-none cursor-pointer accent-[#E8690A]"
                  />
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] bg-[#E8690A] pointer-events-none rounded-full" 
                    style={{ width: `${scrollProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="flex items-center justify-between">
                <button 
                  disabled={currentChapter.index === 1}
                  onClick={(e) => { e.stopPropagation(); navigateChapter(currentChapter.index - 1) }}
                  className="flex items-center gap-2 font-black text-[11px] tracking-widest opacity-60 hover:opacity-100 disabled:opacity-20 transition-all"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                  PREVIOUS
                </button>
                <div className="flex items-center gap-6">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowDrawer(true) }}
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-black/5 hover:bg-black/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">list</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowSettings(true) }}
                    className="flex items-center justify-center w-12 h-12 rounded-full bg-black/5 hover:bg-black/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">format_size</span>
                  </button>
                </div>
                <button 
                  disabled={currentChapter.index === totalChapters}
                  onClick={(e) => { e.stopPropagation(); navigateChapter(currentChapter.index + 1) }}
                  className="flex items-center gap-2 text-[#E8690A] font-black text-[11px] tracking-widest hover:opacity-80 disabled:opacity-20 transition-all"
                >
                  NEXT
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>

      {/* Settings Tray */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-black/20 z-[100] backdrop-blur-[2px]"
            />
            <motion.section
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 z-[110] rounded-t-[32px] shadow-2xl max-w-lg mx-auto overflow-hidden"
              style={{ backgroundColor: 'var(--reader-ui-bg)', color: 'var(--reader-text)' }}
            >
              <div className="w-full flex justify-center py-6 cursor-pointer" onClick={() => setShowSettings(false)}>
                <div className="w-12 h-1.5 bg-current opacity-10 rounded-full"></div>
              </div>
              
              <div className="px-8 pb-12 space-y-10">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">Reading Settings</h3>
                  <button onClick={() => setShowSettings(false)} className="p-2 opacity-40 hover:opacity-100">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                {/* Appearance */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Appearance</p>
                  <div className="flex gap-4">
                    {(['white', 'sepia', 'dark'] as const).map((t) => (
                      <button 
                        key={t}
                        onClick={() => setTheme(t)}
                        className={`flex-1 h-16 rounded-2xl border-2 transition-all flex items-center justify-center gap-3 ${
                          theme === t ? 'border-[#E8690A] bg-orange-50/5' : 'border-transparent bg-black/5'
                        }`}
                      >
                        <div 
                          className="w-5 h-5 rounded-full border border-black/5"
                          style={{ backgroundColor: t === 'white' ? '#f8f9ff' : t === 'sepia' ? '#F5ECD7' : '#1A1A1A' }}
                        />
                        <span className="text-xs font-bold capitalize">{t}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Text Size</p>
                  <div className="flex items-center gap-6 bg-black/5 rounded-2xl p-5">
                    <span className="text-sm font-medium opacity-40">A</span>
                    <input 
                      type="range"
                      min="14"
                      max="32"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="flex-1 h-[3px] bg-black/10 rounded-full appearance-none cursor-pointer accent-[#E8690A]"
                    />
                    <span className="text-2xl font-bold">A</span>
                  </div>
                </div>

                {/* Font Family */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Typography</p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setFontFamily('serif')}
                      className={`flex-1 py-4 rounded-2xl font-serif text-lg border-2 ${fontFamily === 'serif' ? 'border-[#E8690A] bg-orange-50/5' : 'border-transparent bg-black/5'}`}
                    >
                      Newsreader
                    </button>
                    <button 
                      onClick={() => setFontFamily('sans')}
                      className={`flex-1 py-4 rounded-2xl font-sans text-sm font-bold border-2 ${fontFamily === 'sans' ? 'border-[#E8690A] bg-orange-50/5' : 'border-transparent bg-black/5'}`}
                    >
                      Inter UI
                    </button>
                  </div>
                </div>
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>

      {/* Chapters Drawer */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              className="fixed inset-0 bg-black/40 z-[120] backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed top-0 left-0 bottom-0 z-[130] shadow-2xl w-80 max-w-[85vw] flex flex-col"
              style={{ backgroundColor: 'var(--reader-ui-bg)', color: 'var(--reader-text)' }}
            >
              <div className="flex justify-between items-center p-8 border-b" style={{ borderColor: 'var(--reader-border)' }}>
                <h3 className="font-bold text-lg uppercase tracking-widest text-[12px] opacity-40">Chapters</h3>
                <button onClick={() => setShowDrawer(false)} className="p-2 opacity-40 hover:opacity-100">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {allChapters.map((ch) => (
                  <button
                    key={ch.index}
                    onClick={() => {
                      navigateChapter(ch.index)
                      setShowDrawer(false)
                    }}
                    className={`w-full text-left p-4 rounded-2xl transition-all flex items-center gap-4 ${
                      ch.index === currentChapter.index
                        ? 'bg-[#E8690A] text-white shadow-lg shadow-orange-500/20'
                        : 'hover:bg-black/5'
                    }`}
                  >
                    <span className={`text-[10px] font-black tracking-tighter w-6 ${ch.index === currentChapter.index ? 'text-white' : 'opacity-30'}`}>
                      {ch.index < 10 ? `0${ch.index}` : ch.index}
                    </span>
                    <span className="text-sm font-bold truncate">{ch.title}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Theme Quick Toggle */}
      <AnimatePresence>
        {!showBars && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full p-1.5 flex items-center gap-2 shadow-2xl"
          >
            {(['white', 'sepia', 'dark'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  theme === t ? 'scale-110 ring-2 ring-[#E8690A]' : 'opacity-40 hover:opacity-100'
                }`}
                style={{ 
                  backgroundColor: t === 'white' ? '#f8f9ff' : t === 'sepia' ? '#F5ECD7' : '#1A1A1A',
                  color: t === 'white' ? '#0b1c30' : t === 'sepia' ? '#5C4A1E' : '#E0E0E0'
                }}
              >
                {theme === t && <span className="material-symbols-outlined text-sm">check</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
