import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { processPdf } from '@/lib/pdfProcessor'

export const maxDuration = 60 // Allows the function to run up to 60 seconds

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Invalid file type. Only PDF is supported.' }, { status: 400 })
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit.' }, { status: 400 })
    }

    const bookId = uuidv4()
    const filePath = `books/${user.id}/${bookId}.pdf`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('books')
      .upload(filePath, file, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file to storage.' }, { status: 500 })
    }

    // Insert Book Record
    const title = file.name.replace('.pdf', '')
    const { error: dbError } = await supabase
      .from('books')
      .insert({
        id: bookId,
        user_id: user.id,
        title: title,
        status: 'processing',
        storage_path: filePath,
        created_at: new Date().toISOString()
      })

    if (dbError) {
      console.error('Database insert error:', dbError)
      await supabase.storage.from('books').remove([filePath])
      return NextResponse.json({ error: 'Failed to create book record.' }, { status: 500 })
    }

    // Convert File to ArrayBuffer for processing
    const arrayBuffer = await file.arrayBuffer()

    // AWAIT the processing — on Vercel serverless, fire-and-forget
    // doesn't work because the function dies when the response is sent.
    await processPdf(bookId, user.id, arrayBuffer)

    return NextResponse.json({ success: true, bookId })
  } catch (error: any) {
    console.error('Upload handler error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
