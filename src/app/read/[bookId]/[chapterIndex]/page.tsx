import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReaderClient from './ReaderClient'

export default async function ReadPage({ params }: { params: { bookId: string; chapterIndex: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { bookId, chapterIndex } = params
  const cIndex = parseInt(chapterIndex, 10)

  // Fetch book and chapters
  const { data: book } = await supabase
    .from('books')
    .select('id, title')
    .eq('id', bookId)
    .single()

  if (!book) {
    redirect('/library')
  }

  const { data: chapters } = await supabase
    .from('chapters')
    .select('index, title')
    .eq('book_id', bookId)
    .order('index', { ascending: true })

  if (!chapters || chapters.length === 0) {
    return <div>No chapters found.</div>
  }

  // Fetch current chapter content
  const { data: currentChapter } = await supabase
    .from('chapters')
    .select('index, title, content')
    .eq('book_id', bookId)
    .eq('index', cIndex)
    .single()

  if (!currentChapter) {
    redirect(`/read/${bookId}/1`) // Redirect to first chapter if invalid
  }

  // Fetch initial progress
  const { data: progressData } = await supabase
    .from('reading_progress')
    .select('scroll_percent')
    .eq('user_id', user.id)
    .eq('book_id', bookId)
    .eq('chapter_index', cIndex)
    .single()

  const totalChapters = chapters.length

  return (
    <ReaderClient
      bookId={bookId}
      bookTitle={book.title}
      currentChapter={currentChapter}
      allChapters={chapters}
      totalChapters={totalChapters}
      initialScrollPercent={progressData?.scroll_percent || 0}
    />
  )
}
