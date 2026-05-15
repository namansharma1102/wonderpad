import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// Fetch a cover image URL from OpenLibrary API (free, no key needed)
async function fetchBookCover(title: string, author: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${title} ${author !== 'Unknown Author' ? author : ''}`.trim())
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${query}&limit=1`,
      { signal: AbortSignal.timeout(5000) } // 5 second timeout
    )

    if (!res.ok) return null

    const data = await res.json()
    const coverId = data?.docs?.[0]?.cover_i

    if (coverId) {
      return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
    }

    return null
  } catch {
    // Don't let cover fetching break the upload
    return null
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use JSON instead of FormData to avoid large binary payloads hitting limits
    const body = await request.json()
    const { filename, title: extractedTitle, author: rawAuthor, chapters } = body

    if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
      return NextResponse.json({ error: 'No chapter data provided.' }, { status: 400 })
    }

    const title = extractedTitle || filename.replace(/\.pdf$/i, '')
    const author = rawAuthor || 'Unknown Author'
    const bookId = uuidv4()
    
    // We no longer save the PDF binary to Supabase Storage.
    // The reader only needs the extracted chapters, saving bandwidth & storage!

    const admin = createAdminClient()

    // Fetch cover image from Google Books API
    const coverUrl = await fetchBookCover(title, author)

    // Insert book record
    const { error: dbError } = await admin
      .from('books')
      .insert({
        id: bookId,
        user_id: user.id,
        title: title,
        author: author,
        status: 'ready',
        cover_url: coverUrl,
        storage_path: 'json-only',
        created_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Database insert error:', dbError)
      return NextResponse.json({ error: 'Failed to create book record.' }, { status: 500 })
    }

    // Bulk insert chapters
    const chapterRecords = chapters.map((ch: any) => ({
      book_id: bookId,
      index: ch.index,
      title: ch.title,
      start_page: ch.startPage,
      content: ch.content,
    }))

    const { error: chaptersError } = await admin
      .from('chapters')
      .insert(chapterRecords)

    if (chaptersError) {
      console.error('Chapters insert error:', chaptersError)
      await admin.from('books').delete().eq('id', bookId)
      return NextResponse.json({ error: 'Failed to save chapters.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, bookId, status: 'ready' })
  } catch (error: any) {
    console.error('Upload handler error:', error)
    // Handle payload too large error nicely
    if (error?.type === 'entity.too.large') {
       return NextResponse.json({ error: 'Book is too long to process at once.' }, { status: 413 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
