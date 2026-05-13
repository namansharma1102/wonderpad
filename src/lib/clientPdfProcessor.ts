/**
 * Client-side PDF processor v2.
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

  for (let i = 0; i < deduped.length; i++) {
    const startPage = deduped[i].pageNum
    const endPage = i < deduped.length - 1 ? deduped[i + 1].pageNum - 1 : numPages

    let content = ''
    for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
      const page = await pdfDocument.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str).join(' ')
      content += pageText + '\n\n'
    }

    chapters.push({
      index: i + 1,
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

    // Reconstruct text with better line awareness
    // PDF items have transform info — items with very different Y positions are on different lines
    const items = textContent.items as any[]
    const lines: string[] = []
    let currentLine = ''
    let lastY: number | null = null

    for (const item of items) {
      const y = item.transform ? item.transform[5] : null
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 5) {
        // New line
        if (currentLine.trim()) lines.push(currentLine.trim())
        currentLine = item.str
      } else {
        currentLine += item.str
      }
      lastY = y
    }
    if (currentLine.trim()) lines.push(currentLine.trim())

    for (const line of lines) {
      if (isChapterHeading(line)) {
        // Save previous chapter
        if (currentChapter) {
          currentChapter.content = contentBuffer.trim()
          chapters.push(currentChapter)
          contentBuffer = ''
        }

        currentChapter = {
          index: chapters.length + 1,
          title: line,
          startPage: pageNum,
          content: '',
        }
      } else {
        contentBuffer += line + ' '
      }
    }
  }

  // Push the final chapter
  if (currentChapter) {
    currentChapter.content = contentBuffer.trim()
    chapters.push(currentChapter)
  } else {
    // No chapters detected — treat entire book as one chapter
    chapters.push({
      index: 1,
      title: 'Full Text',
      startPage: 1,
      content: contentBuffer.trim(),
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
