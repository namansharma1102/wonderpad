import { createAdminClient } from '@/lib/supabase/admin'

// We use dynamic import for pdfjs-dist to avoid issues at build time
let pdfjsLib: any = null
async function getPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js')
    pdfjsLib.GlobalWorkerOptions.workerSrc = ''
  }
  return pdfjsLib
}

interface Chapter {
  index: number
  title: string
  startPage: number
  content: string
}

export async function processPdf(bookId: string, userId: string, arrayBuffer: ArrayBuffer) {
  const supabase = createAdminClient()

  try {
    const pdfjs = await getPdfJs()
    const uint8Array = new Uint8Array(arrayBuffer)
    const loadingTask = pdfjs.getDocument({
      data: uint8Array,
      useSystemFonts: true,
    })

    const pdfDocument = await loadingTask.promise
    const numPages = pdfDocument.numPages

    // Extract Metadata
    let author = 'Unknown Author'
    try {
      const metadata = await pdfDocument.getMetadata()
      author = metadata?.info?.Author || 'Unknown Author'
    } catch (metaErr) {
      console.error('Metadata extraction failed, using default:', metaErr)
    }

    // Skip cover generation entirely — the canvas native module is unreliable
    // across different server environments (Vercel, Docker, etc.)
    // We'll use a placeholder icon in the UI instead.
    const coverPath = null

    const chapters: Chapter[] = []
    let currentChapter: Chapter | null = null
    let globalContentBuffer = ''

    const chapterRegex = /^(?:CHAPTER|PART)\s+(?:[A-Z0-9]+)/i

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum)
      const textContent = await page.getTextContent()

      // Reconstruct text from PDF items
      const pageStrings = textContent.items.map((item: any) => item.str)
      const pageText = pageStrings.join(' ')
      
      // Split by sentences
      const lines = pageText.split(/(?<=\.|\?|\!)\s+/)

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine) continue

        const isChapterKeyword = chapterRegex.test(trimmedLine)
        const isAllCaps = trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 3 && trimmedLine.length < 60

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
            content: ''
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
      // If no chapters detected, treat the whole book as a single chapter
      chapters.push({
        index: 1,
        title: 'Full Text',
        startPage: 1,
        content: globalContentBuffer.trim()
      })
    }

    // Insert chapters into DB
    const chapterRecords = chapters.map((ch) => ({
      book_id: bookId,
      index: ch.index,
      title: ch.title,
      start_page: ch.startPage,
      content: ch.content,
    }))

    if (chapterRecords.length > 0) {
      const { error: chaptersError } = await supabase
        .from('chapters')
        .insert(chapterRecords)

      if (chaptersError) throw chaptersError
    }

    // Update book status
    const { error: updateError } = await supabase
      .from('books')
      .update({ 
        status: 'ready',
        author: author,
        cover_path: coverPath
      })
      .eq('id', bookId)

    if (updateError) throw updateError

    console.log(`Processed book ${bookId} successfully with ${chapters.length} chapters.`)
  } catch (error) {
    console.error('Error processing PDF:', error)
    
    // Mark as failed
    await supabase
      .from('books')
      .update({ status: 'failed' })
      .eq('id', bookId)
  }
}
