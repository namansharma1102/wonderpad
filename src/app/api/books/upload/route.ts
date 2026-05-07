import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

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

    // Insert book record (status = 'ready' immediately since chapters are already extracted)
    const title = file.name.replace(/\.pdf$/i, '')
    const { error: dbError } = await admin
      .from('books')
      .insert({
        id: bookId,
        user_id: user.id,
        title: title,
        author: author,
        status: 'ready',
        storage_path: filePath,
        cover_path: null,
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
        // Cleanup on failure
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
