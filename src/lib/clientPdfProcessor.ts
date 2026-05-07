/**
 * Client-side PDF processor.
 * Runs entirely in the browser using pdfjs-dist — no server time limits.
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
  pageCount: number
}

export async function processClientPdf(file: File): Promise<ProcessingResult> {
  const arrayBuffer = await file.arrayBuffer()
  const uint8Array = new Uint8Array(arrayBuffer)

  const loadingTask = pdfjsLib.getDocument({ data: uint8Array })
  const pdfDocument = await loadingTask.promise
  const numPages = pdfDocument.numPages

  // Extract metadata
  let author = 'Unknown Author'
  try {
    const metadata = await pdfDocument.getMetadata()
    const info = metadata?.info as any
    author = info?.Author || 'Unknown Author'
  } catch {
    // Metadata extraction is optional
  }

  // Extract text page by page
  const chapters: ExtractedChapter[] = []
  let currentChapter: ExtractedChapter | null = null
  let globalContentBuffer = ''

  const chapterRegex = /^(?:CHAPTER|PART)\s+(?:[A-Z0-9IVXLC]+)/i

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum)
    const textContent = await page.getTextContent()

    const pageStrings = textContent.items.map((item: any) => item.str)
    const pageText = pageStrings.join(' ')

    // Split into lines/sentences
    const lines = pageText.split(/(?<=\.|\?|!)\s+/)

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine) continue

      const isChapterKeyword = chapterRegex.test(trimmedLine)
      const isAllCaps =
        trimmedLine === trimmedLine.toUpperCase() &&
        trimmedLine.length > 3 &&
        trimmedLine.length < 60 &&
        /[A-Z]/.test(trimmedLine)

      if ((isChapterKeyword || isAllCaps) && trimmedLine.length < 100) {
        if (currentChapter) {
          currentChapter.content = globalContentBuffer.trim()
          chapters.push(currentChapter)
          globalContentBuffer = ''
        }

        currentChapter = {
          index: chapters.length + 1,
          title: trimmedLine,
          startPage: pageNum,
          content: '',
        }
      } else {
        globalContentBuffer += trimmedLine + ' '
      }
    }
  }

  // Push the final chapter
  if (currentChapter) {
    currentChapter.content = globalContentBuffer.trim()
    chapters.push(currentChapter)
  } else {
    chapters.push({
      index: 1,
      title: 'Full Text',
      startPage: 1,
      content: globalContentBuffer.trim(),
    })
  }

  return { chapters, author, pageCount: numPages }
}
