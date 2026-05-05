import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LibraryClient from './LibraryClient'

export default async function LibraryPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch initial books
  const { data: books } = await supabase
    .from('books')
    .select(`
      id, 
      title, 
      status,
      author,
      cover_path,
      reading_progress (
        chapter_index,
        scroll_percent
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Process books to flatten progress
  const processedBooks = (books || []).map((book: any) => ({
    id: book.id,
    title: book.title,
    status: book.status,
    author: book.author,
    cover_path: book.cover_path,
    progress: book.reading_progress?.[0] || null
  }))

  return <LibraryClient initialBooks={processedBooks} />
}
