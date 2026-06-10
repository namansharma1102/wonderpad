/**
 * Client-side PDF processor v3.
 * - Adaptive paragraph detection using median Y-delta analysis (two-pass)
 * - Uses PDF outline/bookmarks for chapter detection (primary method)
 * - Falls back to improved heuristics (secondary)
 * - Extracts proper book title from PDF metadata
 * Runs entirely in the browser — no server time limits.
 */
import * as pdfjsLib from 'pdfjs-dist'

// Point to the CDN-hosted worker for browser compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

export interface ExtractedChapter {
  index: number
  title: string
  startPage: number
  content: string
}

export interface ProcessingResult {
  chapters: ExtractedChapter[]
  author: string
  title: string   // Extracted from PDF metadata
  pageCount: number
}

// ─── Utility: Compute the median of an array of numbers ─────────────────────

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

// ─── Utility: Analyse Y-deltas on a page to find the normal line spacing ────
// Returns the median Y-delta (i.e. the "standard" line height for this page).
// We only consider deltas > 0 (actual vertical movement) and filter out
// tiny jitter (sub-pixel differences from the same visual line).

function computeNormalLineSpacing(items: any[]): number {
  const yDeltas: number[] = []
  let lastY: number | null = null

  for (const item of items) {
    if (!item.str || item.str.trim() === '') continue
    const y = item.transform ? item.transform[5] : null
    if (y === null) continue
    const height = item.height || 10

    if (lastY !== null) {
      const delta = Math.abs(y - lastY)
      // Only consider deltas that represent an actual line change
      // (more than 40% of font height — filters out same-line items)
      if (delta > height * 0.4) {
        yDeltas.push(delta)
      }
    }
    lastY = y
  }

  return median(yDeltas)
}

// ─── Outline-based chapter extraction ───────────────────────────────────────
// Many published PDFs embed a Table of Contents as "outlines" (bookmarks).
// This is the most reliable method.

async function getOutlinePageNumbers(
  pdfDocument: any,
  outline: any[]
): Promise<{ title: string; pageNum: number }[]> {
  const results: { title: string; pageNum: number }[] = []

  for (const item of outline) {
    if (item.dest) {
      try {
        let dest = item.dest
        // dest can be a string name or an array
        if (typeof dest === 'string') {
          dest = await pdfDocument.getDestination(dest)
        }
        if (dest && dest[0]) {
          const pageIndex = await pdfDocument.getPageIndex(dest[0])
          results.push({ title: item.title, pageNum: pageIndex + 1 }) // 1-indexed
        }
      } catch {
        // Skip unresolvable destinations
      }
    }
    // Recurse into children
    if (item.items && item.items.length > 0) {
      const childResults = await getOutlinePageNumbers(pdfDocument, item.items)
      results.push(...childResults)
    }
  }

  return results
}

async function extractChaptersFromOutline(
  pdfDocument: any,
  numPages: number
): Promise<ExtractedChapter[] | null> {
  const outline = await pdfDocument.getOutline()
  if (!outline || outline.length === 0) return null

  const tocEntries = await getOutlinePageNumbers(pdfDocument, outline)
  if (tocEntries.length === 0) return null

  // Sort by page number
  tocEntries.sort((a, b) => a.pageNum - b.pageNum)

  // Deduplicate entries on the same page (keep first)
  const deduped: typeof tocEntries = []
  const seenPages = new Set<number>()
  for (const entry of tocEntries) {
    if (!seenPages.has(entry.pageNum)) {
      deduped.push(entry)
      seenPages.add(entry.pageNum)
    }
  }

  if (deduped.length < 2) return null // Need at least 2 entries to be useful

  // Extract text for each chapter range
  const chapters: ExtractedChapter[] = []

  // Add Prelude if there are pages before the first outline entry
  if (deduped[0].pageNum > 1) {
    let preludeContent = ''
    for (let pageNum = 1; pageNum < deduped[0].pageNum; pageNum++) {
      const page = await pdfDocument.getPage(pageNum)
      const pageText = await extractPageHTML(page)
      preludeContent += pageText + '\n'
    }
    if (preludeContent.replace(/<[^>]+>/g, '').trim().length > 100) {
      chapters.push({
        index: 1,
        title: 'Prelude',
        startPage: 1,
        content: preludeContent.trim(),
      })
    }
  }

  for (let i = 0; i < deduped.length; i++) {
    const startPage = deduped[i].pageNum
    const endPage = i < deduped.length - 1 ? deduped[i + 1].pageNum - 1 : numPages

    let content = ''
    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      const page = await pdfDocument.getPage(pageNum)
      const pageText = await extractPageHTML(page)
      content += pageText + '\n'
    }

    chapters.push({
      index: chapters.length + 1,
      title: deduped[i].title.trim(),
      startPage,
      content: content.trim(),
    })
  }

  return chapters.length >= 2 ? chapters : null
}

// ─── Heuristic-based chapter extraction (fallback) ──────────────────────────
// Used when the PDF has no outline/bookmarks.

// Common non-chapter ALL_CAPS strings to ignore
const FALSE_POSITIVE_CAPS = new Set([
  'THE END', 'ACKNOWLEDGEMENTS', 'ACKNOWLEDGMENTS', 'ABOUT THE AUTHOR',
  'BIBLIOGRAPHY', 'GLOSSARY', 'INDEX', 'DEDICATION', 'EPIGRAPH',
  'CONTENTS', 'TABLE OF CONTENTS', 'COPYRIGHT', 'ALSO BY',
  'ABOUT THE ILLUSTRATOR', 'AUTHOR NOTE', "AUTHOR'S NOTE",
  'A NOTE FROM THE AUTHOR', 'BOOKS BY', 'OTHER BOOKS BY',
  'PRAISE FOR', 'REVIEWS', 'FOREWORD', 'INTRODUCTION',
  'APPENDIX', 'NOTES', 'AFTERWORD', 'POSTSCRIPT',
])

// Expanded chapter heading patterns
const CHAPTER_PATTERNS = [
  /^CHAPTER\s+[\dIVXLCDMivxlcdm]+/i,          // CHAPTER 1, Chapter IV
  /^CHAPTER\s+\w+/i,                             // Chapter One, Chapter The First
  /^PART\s+[\dIVXLCDMivxlcdm]+/i,               // PART 1, Part II
  /^PART\s+\w+/i,                                // Part One
  /^BOOK\s+[\dIVXLCDMivxlcdm]+/i,               // Book 1, Book III
  /^PROLOGUE$/i,
  /^EPILOGUE$/i,
  /^INTERLUDE$/i,
]

function isChapterHeading(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.length < 3 || trimmed.length > 80) return false

  // Check explicit chapter patterns
  for (const pattern of CHAPTER_PATTERNS) {
    if (pattern.test(trimmed)) return true
  }

  // Check ALL_CAPS but filter false positives
  if (
    trimmed === trimmed.toUpperCase() &&
    trimmed.length > 3 &&
    trimmed.length < 50 &&
    /[A-Z]/.test(trimmed) &&
    !/^\d+$/.test(trimmed) &&            // Not just a number
    !FALSE_POSITIVE_CAPS.has(trimmed)
  ) {
    // Additional check: ALL_CAPS text that looks like a chapter title
    // must have at least 2 alphabetic characters and shouldn't be a sentence fragment
    const wordCount = trimmed.split(/\s+/).length
    if (wordCount <= 6) return true
  }

  return false
}

// ─── Core page text extraction with adaptive paragraph detection ────────────
// This is the v3 engine. It uses a two-pass approach:
//   Pass 1: Scan all Y-deltas on the page to find the median (= normal line spacing)
//   Pass 2: Walk through items, marking gaps > 1.5x median as paragraph breaks

async function extractPageHTML(page: any): Promise<string> {
  const textContent = await page.getTextContent()
  const items = textContent.items as any[]

  if (items.length === 0) return ''

  // ── Pass 1: Determine normal line spacing for this page ──
  const normalSpacing = computeNormalLineSpacing(items)
  // Paragraph threshold: if gap is more than 1.5x the normal spacing, it's a new paragraph
  const paragraphThreshold = normalSpacing > 0 ? normalSpacing * 1.5 : Infinity

  // ── Pass 2: Build HTML with adaptive paragraph detection ──
  let html = ''
  let lastY = -1
  let lastX = -1

  for (const item of items) {
    if (!item.str || item.str.trim() === '') {
      // Preserve explicit spaces
      if (html.length > 0 && !html.endsWith(' ') && !html.endsWith('\n')) {
        html += ' '
      }
      continue
    }

    const x = item.transform[4]
    const y = item.transform[5]
    const height = item.height || 10

    if (lastY !== -1) {
      const delta = Math.abs(y - lastY)

      if (delta > paragraphThreshold) {
        // ── PARAGRAPH BREAK ──
        // Gap is significantly larger than normal line spacing
        html += '</p><p>'
      } else if (delta > height * 0.4) {
        // ── NORMAL LINE WRAP ──
        // Same paragraph, just wrapping to next line — join with a space
        if (!html.endsWith(' ')) html += ' '
      } else if (lastX !== -1 && (x - lastX) > (height * 0.15)) {
        // ── INLINE WORD GAP ──
        // Items on the same line with a horizontal gap
        if (!html.endsWith(' ')) html += ' '
      }
    }

    // Font style detection
    let isBold = false
    let isItalic = false
    try {
      const font = page.commonObjs.has(item.fontName)
        ? page.commonObjs.get(item.fontName)
        : page.objs.get(item.fontName)
      if (font && font.name) {
        const name = font.name.toLowerCase()
        isBold = name.includes('bold') || name.includes('black') || name.includes('heavy')
        isItalic = name.includes('italic') || name.includes('oblique')
      }
    } catch {
      // ignore
    }

    let text = item.str
    if (isBold) text = `<b>${text}</b>`
    if (isItalic) text = `<i>${text}</i>`

    html += text
    lastY = y
    lastX = x + item.width
  }

  // Wrap in paragraph tags for clean structure
  return '<p>' + html + '</p>'
}

async function extractChaptersHeuristic(
  pdfDocument: any,
  numPages: number
): Promise<ExtractedChapter[]> {
  const chapters: ExtractedChapter[] = []
  let currentChapter: ExtractedChapter | null = null
  let contentBuffer = ''

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum)
    const textContent = await page.getTextContent()
    const items = textContent.items as any[]

    // ── Pass 1: Determine normal line spacing for this page ──
    const normalSpacing = computeNormalLineSpacing(items)
    const paragraphThreshold = normalSpacing > 0 ? normalSpacing * 1.5 : Infinity

    // ── Pass 2: Walk items and build structured lines ──
    // A "line" here is a single visual line in the PDF.
    // We track whether there was a paragraph-sized gap before each line.
    const lines: { text: string; isParagraphBreak: boolean }[] = []
    let currentLine = ''
    let lastY: number | null = null
    let lastX: number | null = null
    let pendingParagraphBreak = false

    for (const item of items) {
      if (!item.str || item.str.trim() === '') {
        currentLine += ' '
        continue
      }
      const x = item.transform ? item.transform[4] : null
      const y = item.transform ? item.transform[5] : null
      const height = item.height || 10

      if (lastY !== null && y !== null) {
        const delta = Math.abs(y - lastY)

        if (delta > paragraphThreshold) {
          // Paragraph break
          if (currentLine.trim()) lines.push({ text: currentLine.trim(), isParagraphBreak: pendingParagraphBreak })
          currentLine = ''
          pendingParagraphBreak = true
        } else if (delta > height * 0.4) {
          // Normal line wrap
          if (currentLine.trim()) lines.push({ text: currentLine.trim(), isParagraphBreak: pendingParagraphBreak })
          currentLine = ''
          pendingParagraphBreak = false
        } else if (lastX !== null && x !== null && (x - lastX) > (height * 0.15)) {
          currentLine += ' '
        }
      }

      // Font style detection
      let isBold = false
      let isItalic = false
      try {
        const font = page.commonObjs.has(item.fontName)
          ? page.commonObjs.get(item.fontName)
          : page.objs.get(item.fontName)
        if (font && font.name) {
          const name = font.name.toLowerCase()
          isBold = name.includes('bold') || name.includes('black') || name.includes('heavy')
          isItalic = name.includes('italic') || name.includes('oblique')
        }
      } catch {
        // ignore
      }

      let text = item.str
      if (isBold) text = `<b>${text}</b>`
      if (isItalic) text = `<i>${text}</i>`

      currentLine += text
      lastY = y
      if (x !== null) lastX = x + item.width
    }
    if (currentLine.trim()) lines.push({ text: currentLine.trim(), isParagraphBreak: pendingParagraphBreak })

    // ── Process lines for chapter detection ──
    for (const lineObj of lines) {
      const plainText = lineObj.text.replace(/<[^>]+>/g, '')
      if (isChapterHeading(plainText)) {
        // Save previous chapter
        if (currentChapter) {
          currentChapter.content = contentBuffer.trim()
          chapters.push(currentChapter)
        } else if (contentBuffer.replace(/<[^>]+>/g, '').trim().length > 100) {
          chapters.push({
            index: chapters.length + 1,
            title: 'Prelude',
            startPage: 1,
            content: contentBuffer.trim(),
          })
        }
        contentBuffer = ''

        currentChapter = {
          index: chapters.length + 1,
          title: lineObj.text,
          startPage: pageNum,
          content: '',
        }
      } else {
        // If this line starts a new paragraph, close the previous paragraph and open a new one
        if (lineObj.isParagraphBreak) {
          contentBuffer += '</p><p>' + lineObj.text
        } else {
          // Same paragraph — join with a space
          contentBuffer += ' ' + lineObj.text
        }
      }
    }
  }

  // Push the final chapter
  if (currentChapter) {
    currentChapter.content = '<p>' + contentBuffer.trim() + '</p>'
    chapters.push(currentChapter)
  } else {
    // No chapters detected — treat entire book as one chapter
    chapters.push({
      index: 1,
      title: 'Full Text',
      startPage: 1,
      content: '<p>' + contentBuffer.trim() + '</p>',
    })
  }

  return chapters
}

// ─── Main entry point ───────────────────────────────────────────────────────

export async function processClientPdf(file: File): Promise<ProcessingResult> {
  const arrayBuffer = await file.arrayBuffer()
  const uint8Array = new Uint8Array(arrayBuffer)

  const loadingTask = pdfjsLib.getDocument({ data: uint8Array })
  const pdfDocument = await loadingTask.promise
  const numPages = pdfDocument.numPages

  // Extract metadata for title and author
  let author = 'Unknown Author'
  let title = file.name.replace(/\.pdf$/i, '') // Fallback to filename
  try {
    const metadata = await pdfDocument.getMetadata()
    const info = metadata?.info as any
    if (info?.Author) author = info.Author
    // Use metadata title if it's meaningful (not empty, not a filepath, not just the filename)
    if (info?.Title && info.Title.trim().length > 1 && !info.Title.includes('/') && !info.Title.includes('\\')) {
      title = info.Title.trim()
    }
  } catch {
    // Metadata extraction is optional
  }

  // Strategy 1: Try PDF outline (most reliable)
  let chapters = await extractChaptersFromOutline(pdfDocument, numPages)

  // Strategy 2: Fall back to improved heuristics
  if (!chapters) {
    chapters = await extractChaptersHeuristic(pdfDocument, numPages)
  }

  return { chapters, author, title, pageCount: numPages }
}
