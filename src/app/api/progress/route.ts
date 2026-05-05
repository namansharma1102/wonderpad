import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { book_id, chapter_index, scroll_percent } = body

    if (!book_id || chapter_index === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { error } = await supabase
      .from('reading_progress')
      .upsert({
        user_id: user.id,
        book_id,
        chapter_index,
        scroll_percent: scroll_percent || 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,book_id' })

    if (error) {
      console.error('Upsert progress error:', error)
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Progress API error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
