'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Settings, List, ChevronLeft, ChevronRight, X } from 'lucide-react'
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
const DEFAULT_FONT = 'georgia'
const DEFAULT_SIZE = 18

const themes = {
  white: { bg: '#FAFAFA', text: '#000000', label: 'White' },
  sepia: { bg: '#F5ECD7', text: '#5B4636', label: 'Sepia' },
  dark: { bg: '#1A1A1A', text: '#E5E5E5', label: 'Dark' },
}

export default function ReaderClient({
  bookId,
  bookTitle,
  currentChapter,
  allChapters,
  totalChapters,
  initialScrollPercent = 0,
}: ReaderClientProps) {
  const router = useRouter()

  // State
  const [showBars, setShowBars] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)

  // Settings state
  const [theme, setTheme] = useState<'white' | 'sepia' | 'dark'>(DEFAULT_THEME)
  const [fontFamily, setFontFamily] = useState(DEFAULT_FONT)
  const [fontSize, setFontSize] = useState(DEFAULT_SIZE)

  const contentRef = useRef<HTMLDivElement>(null)
  const scrollPercentRef = useRef<number>(initialScrollPercent)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('wonderpad_reader_settings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.theme) setTheme(parsed.theme)
        if (parsed.fontFamily) setFontFamily(parsed.fontFamily)
        if (parsed.fontSize) setFontSize(parsed.fontSize)
      } catch (e) {
        console.error('Failed to parse settings')
      }
    }
    
    // Prevent body scroll to lock the viewport as per requirement
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  // Save settings
  useEffect(() => {
    localStorage.setItem(
      'wonderpad_reader_settings',
      JSON.stringify({ theme, fontFamily, fontSize })
    )
  }, [theme, fontFamily, fontSize])

  // Progress tracking and auto-saving
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
    } catch (e) {
      console.error('Failed to save progress', e)
    }
  }

  // Restore scroll and set up save intervals
  useEffect(() => {
    const el = contentRef.current
    if (el && initialScrollPercent > 0) {
      // Small delay ensures font sizing is applied before calculating scrollHeight
      setTimeout(() => {
        const scrollable = el.scrollHeight - el.clientHeight
        el.scrollTop = (initialScrollPercent / 100) * scrollable
      }, 100)
    }

    const intervalId = setInterval(saveProgress, 10000)

    const handleBlur = () => {
      saveProgress()
    }
    window.addEventListener('blur', handleBlur)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('blur', handleBlur)
      saveProgress() // Save on unmount (navigation)
    }
  }, [bookId, currentChapter.index])

  const handleScroll = () => {
    const el = contentRef.current
    if (!el) return
    const scrollable = el.scrollHeight - el.clientHeight
    if (scrollable <= 0) {
      scrollPercentRef.current = 100
      return
    }
    const pct = (el.scrollTop / scrollable) * 100
    scrollPercentRef.current = Math.min(100, Math.max(0, pct))
  }

  // Handlers
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

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(e.target.value, 10)
    navigateChapter(newIndex)
  }

  const progressPercentage = Math.round((currentChapter.index / totalChapters) * 100)

  // CSS variables derived from settings
  const cssVars = {
    '--bg-color': themes[theme].bg,
    '--text-color': themes[theme].text,
    '--font-family': fontFamily === 'georgia' ? 'Georgia, serif' : 'Inter, sans-serif',
    '--font-size': `${fontSize}px`,
  } as React.CSSProperties

  // Render paragraphs properly
  // Paragraphs with line-height 1.75, spacing 1.5em between paragraphs, 1.5em text-indent except first paragraph
  const contentParagraphs = currentChapter.content
    .split(/\n+/)
    .filter((p) => p.trim() !== '')

  return (
    <div
      className="fixed inset-0 flex flex-col transition-colors duration-300"
      style={{ ...cssVars, backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
    >
      {/* Top Bar */}
      <AnimatePresence>
        {showBars && (
          <motion.div
            initial={{ y: '-100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute top-0 left-0 right-0 z-40 bg-[var(--bg-color)] border-b border-opacity-20 border-black shadow-sm flex items-center justify-between px-4 py-3"
          >
            <button
              onClick={() => router.push('/library')}
              className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center flex-1 mx-4 overflow-hidden">
              <span className="text-xs font-semibold opacity-60 uppercase tracking-widest truncate w-full text-center">
                {bookTitle}
              </span>
              <span className="text-sm font-medium truncate w-full text-center">
                {currentChapter.title}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDrawer(true)
                  setShowBars(false)
                }}
                className="p-2 rounded-full hover:bg-black/5 transition-colors"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSettings(true)
                  setShowBars(false)
                }}
                className="p-2 -mr-2 rounded-full hover:bg-black/5 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reading Canvas */}
      <div
        className="flex-1 overflow-y-auto cursor-pointer"
        onClick={toggleBars}
        onScroll={handleScroll}
        ref={contentRef}
      >
        <div className="max-w-[680px] mx-auto px-5 py-12 md:py-20 min-h-full flex flex-col">
          <h1
            className="text-3xl md:text-4xl font-bold mb-12 text-center"
            style={{ fontFamily: 'var(--font-family)' }}
          >
            {currentChapter.title}
          </h1>

          <div
            className="flex-1 text-justify"
            style={{
              fontFamily: 'var(--font-family)',
              fontSize: 'var(--font-size)',
              lineHeight: 1.75,
            }}
          >
            {contentParagraphs.map((para, idx) => (
              <p
                key={idx}
                className="mb-[1.5em]"
                style={{ textIndent: idx === 0 ? '0' : '1.5em' }}
              >
                {para}
              </p>
            ))}
          </div>

          {/* End of Chapter Controls */}
          <div className="mt-16 pt-12 border-t border-opacity-20 border-black flex flex-col sm:flex-row gap-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => navigateChapter(currentChapter.index - 1)}
              disabled={currentChapter.index === 1}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border border-opacity-20 border-black hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium text-sm font-['Inter']"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous Chapter
            </button>
            <button
              onClick={() => navigateChapter(currentChapter.index + 1)}
              disabled={currentChapter.index === totalChapters}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border border-opacity-20 border-black hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-medium text-sm font-['Inter']"
            >
              Next Chapter
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <AnimatePresence>
        {showBars && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-0 right-0 z-40 bg-[var(--bg-color)] border-t border-opacity-20 border-black shadow-sm p-4"
          >
            <div className="max-w-[680px] mx-auto flex items-center gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigateChapter(currentChapter.index - 1)
                }}
                disabled={currentChapter.index === 1}
                className="p-2 rounded-full hover:bg-black/5 disabled:opacity-30"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex-1 flex flex-col items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max={totalChapters}
                  value={currentChapter.index}
                  onChange={handleSliderChange}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full h-1 bg-black/10 rounded-lg appearance-none cursor-pointer accent-[#E8690A]"
                />
                <span className="text-xs font-semibold opacity-70 font-['Inter']">
                  Chapter {currentChapter.index} of {totalChapters} ({progressPercentage}%)
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigateChapter(currentChapter.index + 1)
                }}
                disabled={currentChapter.index === totalChapters}
                className="p-2 rounded-full hover:bg-black/5 disabled:opacity-30"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
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
              className="absolute inset-0 z-40 bg-black/20"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 z-50 bg-[var(--bg-color)] border-t border-opacity-20 border-black p-6 rounded-t-3xl shadow-xl max-w-md mx-auto font-['Inter']"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">Appearance</h3>
                <button onClick={() => setShowSettings(false)} className="p-1 rounded-full hover:bg-black/5">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Theme */}
              <div className="mb-6">
                <p className="text-sm font-semibold opacity-70 uppercase tracking-wider mb-3">Theme</p>
                <div className="flex gap-3">
                  {(Object.keys(themes) as Array<keyof typeof themes>).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      style={{ backgroundColor: themes[t].bg, color: themes[t].text }}
                      className={`flex-1 py-3 rounded-xl border-2 transition-all font-medium ${
                        theme === t ? 'border-[#E8690A]' : 'border-transparent shadow-sm'
                      }`}
                    >
                      {themes[t].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family */}
              <div className="mb-6">
                <p className="text-sm font-semibold opacity-70 uppercase tracking-wider mb-3">Font</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setFontFamily('georgia')}
                    className={`flex-1 py-3 rounded-xl border-2 transition-all font-['Georgia'] text-lg ${
                      fontFamily === 'georgia' ? 'border-[#E8690A] bg-black/5' : 'border-black/10'
                    }`}
                  >
                    Serif
                  </button>
                  <button
                    onClick={() => setFontFamily('inter')}
                    className={`flex-1 py-3 rounded-xl border-2 transition-all font-['Inter'] text-lg ${
                      fontFamily === 'inter' ? 'border-[#E8690A] bg-black/5' : 'border-black/10'
                    }`}
                  >
                    Sans
                  </button>
                </div>
              </div>

              {/* Font Size */}
              <div>
                <p className="text-sm font-semibold opacity-70 uppercase tracking-wider mb-3">Size</p>
                <div className="flex items-center gap-4 bg-black/5 rounded-xl p-2">
                  <button
                    onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                    disabled={fontSize <= 14}
                    className="flex-1 py-2 rounded-lg hover:bg-black/5 disabled:opacity-30 font-semibold"
                  >
                    Aa-
                  </button>
                  <span className="font-medium text-sm w-8 text-center">{fontSize}</span>
                  <button
                    onClick={() => setFontSize(Math.min(26, fontSize + 2))}
                    disabled={fontSize >= 26}
                    className="flex-1 py-2 rounded-lg hover:bg-black/5 disabled:opacity-30 font-bold text-lg"
                  >
                    Aa+
                  </button>
                </div>
              </div>
            </motion.div>
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
              className="absolute inset-0 z-40 bg-black/20"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 bottom-0 z-50 bg-[var(--bg-color)] border-l border-opacity-20 border-black shadow-xl w-80 max-w-[80vw] flex flex-col font-['Inter']"
            >
              <div className="flex justify-between items-center p-6 border-b border-opacity-20 border-black">
                <h3 className="font-bold text-lg">Table of Contents</h3>
                <button onClick={() => setShowDrawer(false)} className="p-1 rounded-full hover:bg-black/5">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {allChapters.map((ch) => (
                  <button
                    key={ch.index}
                    onClick={() => {
                      navigateChapter(ch.index)
                      setShowDrawer(false)
                    }}
                    className={`w-full text-left py-3 px-4 rounded-xl transition-colors mb-1 truncate ${
                      ch.index === currentChapter.index
                        ? 'bg-[#E8690A] text-white font-semibold'
                        : 'hover:bg-black/5 opacity-80'
                    }`}
                  >
                    {ch.title}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
