import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

// Fetch a cover image URL from Google Books API (free, no key needed)
async function fetchBookCover(title: string, author: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${title} ${author !== 'Unknown Author' ? author : ''}`.trim())
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1&fields=items(volumeInfo/imageLinks)`,
      { signal: AbortSignal.timeout(5000) } // 5 second timeout
    )

    if (!res.ok) return null

    const data = await res.json()
    const imageLinks = data?.items?.[0]?.volumeInfo?.imageLinks

    if (imageLinks) {
      // Prefer higher quality images, remove edge=curl parameter
      const url = (imageLinks.thumbnail || imageLinks.smallThumbnail || '')
        .replace('&edge=curl', '')
        .replace('http://', 'https://')
      // Request a larger image by modifying the zoom parameter
      return url ? url.replace('zoom=1', 'zoom=2') : null
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const chaptersJson = formData.get('chapters') as string
    const author = formData.get('author') as string || 'Unknown Author'
    const extractedTitle = formData.get('title') as string || ''

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Invalid file type. Only PDF is supported.' }, { status: 400 })
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit.' }, { status: 400 })
    }

    if (!chaptersJson) {
      return NextResponse.json({ error: 'No chapter data provided.' }, { status: 400 })
    }

    let chapters: Array<{ index: number; title: string; startPage: number; content: string }>
    try {
      chapters = JSON.parse(chaptersJson)
    } catch {
      return NextResponse.json({ error: 'Invalid chapter data.' }, { status: 400 })
    }

    // Use extracted title from PDF metadata, fall back to cleaned filename
    const title = extractedTitle || file.name.replace(/\.pdf$/i, '')

    const bookId = uuidv4()
    const filePath = `books/${user.id}/${bookId}.pdf`

    // Upload PDF to Supabase Storage
    const admin = createAdminClient()

    const { error: uploadError } = await admin.storage
      .from('books')
      .upload(filePath, file, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file to storage.' }, { status: 500 })
    }

    // Fetch cover image from Google Books API
    const coverUrl = await fetchBookCover(title, author)

    // Insert book record (status = 'ready' since chapters are already extracted)
    const { error: dbError } = await admin
      .from('books')
      .insert({
        id: bookId,
        user_id: user.id,
        title: title,
        author: author,
        status: 'ready',
        storage_path: filePath,
        cover_url: coverUrl,
        created_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Database insert error:', dbError)
      await admin.storage.from('books').remove([filePath])
      return NextResponse.json({ error: 'Failed to create book record.' }, { status: 500 })
    }

    // Bulk insert chapters
    const chapterRecords = chapters.map((ch) => ({
      book_id: bookId,
      index: ch.index,
      title: ch.title,
      start_page: ch.startPage,
      content: ch.content,
    }))

    if (chapterRecords.length > 0) {
      const { error: chaptersError } = await admin
        .from('chapters')
        .insert(chapterRecords)

      if (chaptersError) {
        console.error('Chapters insert error:', chaptersError)
        await admin.from('books').delete().eq('id', bookId)
        await admin.storage.from('books').remove([filePath])
        return NextResponse.json({ error: 'Failed to save chapters.' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, bookId, status: 'ready' })
  } catch (error: any) {
    console.error('Upload handler error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
