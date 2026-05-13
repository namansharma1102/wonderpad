import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChapterEditorClient from './ChapterEditorClient'

interface ManageBookPageProps {
  params: {
    bookId: string
  }
}

export default async function ManageBookPage({ params }: ManageBookPageProps) {
  const { bookId } = params
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch book and chapters
  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single()

  if (!book || book.user_id !== user.id) {
    redirect('/library')
  }

  const { data: chapters } = await supabase
    .from('chapters')
    .select('*')
    .eq('book_id', bookId)
    .order('index', { ascending: true })

  return <ChapterEditorClient book={book} initialChapters={chapters || []} />
}
