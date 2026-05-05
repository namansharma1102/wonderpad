import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js'
import { createClient } from '@/lib/supabase/server'
import { createCanvas } from 'canvas'

// Disable workers in Node environment
pdfjsLib.GlobalWorkerOptions.workerSrc = ''

interface Chapter {
  index: number
  title: string
  startPage: number
  content: string
}

export async function processPdf(bookId: string, userId: string, arrayBuffer: ArrayBuffer) {
  const supabase = createClient()

  try {
    const uint8Array = new Uint8Array(arrayBuffer)
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      useSystemFonts: true,
      standardFontDataUrl: 'node_modules/pdfjs-dist/standard_fonts/',
    })

    const pdfDocument = await loadingTask.promise
    const numPages = pdfDocument.numPages

    // Extract Metadata
    const metadata = await pdfDocument.getMetadata()
    const author = metadata?.info?.Author || 'Unknown Author'

    // Extract Cover (First Page)
    let coverPath = null
    try {
      const firstPage = await pdfDocument.getPage(1)
      const viewport = firstPage.getViewport({ scale: 1.0 })
      const canvas = createCanvas(viewport.width, viewport.height)
      const context = canvas.getContext('2d')

      await firstPage.render({
        canvasContext: context as any,
        viewport: viewport,
      }).promise

      const coverBuffer = canvas.toBuffer('image/jpeg', { quality: 0.8 })
      coverPath = `covers/${userId}/${bookId}.jpg`

      const { error: coverError } = await supabase.storage
        .from('books') // Use 'books' bucket or create 'covers' bucket
        .upload(coverPath, coverBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        })
      
      if (coverError) {
        console.error('Failed to upload cover', coverError)
        coverPath = null
      }
    } catch (coverErr) {
      console.error('Error generating cover:', coverErr)
    }

    const chapters: Chapter[] = []
    let currentChapter: Chapter | null = null
    let globalContentBuffer = ''

    // Regex to detect chapter headings. Adjust based on exact requirements.
    // Matches "Chapter N", "CHAPTER N", "Part N" or short all-caps lines
    const chapterRegex = /^(?:CHAPTER|PART)\s+(?:[A-Z0-9]+)|^(?:[A-Z0-9\s.,?!'"-]{2,50})$/im

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum)
      const textContent = await page.getTextContent()

      // Reconstruct text from PDF items
      const pageStrings = textContent.items.map((item: any) => item.str)
      const pageText = pageStrings.join(' ')
      
      // Basic text segmentation
      const lines = pageText.split(/(?<=\.|\?|\!)\s+/) // Split roughly by sentences or explicit breaks

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine) continue

        // Check if line looks like a chapter heading
        // Heuristic: It's relatively short, and either matches explicit keywords or is entirely uppercase
        const isHeadingMatch = chapterRegex.test(trimmedLine)
        const isAllCaps = trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 3 && trimmedLine.length < 60
        const isChapterKeyword = /^(CHAPTER|PART)\s+\w+/i.test(trimmedLine)

        if ((isChapterKeyword || (isAllCaps && isHeadingMatch)) && trimmedLine.length < 100) {
          // If we already have a chapter, save its content
          if (currentChapter) {
            currentChapter.content = globalContentBuffer.trim()
            chapters.push(currentChapter)
            globalContentBuffer = ''
          }

          // Start a new chapter
          currentChapter = {
            index: chapters.length + 1,
            title: trimmedLine,
            startPage: pageNum,
            content: ''
          }
        } else {
          // Add to current buffer
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
