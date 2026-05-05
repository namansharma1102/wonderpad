import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: book, error } = await supabase
      .from('books')
      .select('status, title')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    return NextResponse.json({ status: book.status, title: book.title })
  } catch (error: any) {
    console.error('Status check error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
