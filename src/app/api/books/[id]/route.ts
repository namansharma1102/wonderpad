import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()

    // Ensure user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Verify ownership
    const { data: book, error: fetchError } = await supabase
      .from('books')
      .select('user_id')
      .eq('id', id)
      .single()

    if (fetchError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    if (book.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Due to ON DELETE CASCADE on chapters and progress tables (if configured correctly),
    // deleting the book should delete the associated data.
    // If not, we might need to manually delete chapters/progress. Assuming cascade for now, or just delete book.
    const { error: deleteError } = await supabase
      .from('books')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Delete book error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
