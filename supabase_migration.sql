-- Add cover_url column for Google Books API cover image URLs
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE books ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Also clean up any stuck 'processing' or 'failed' books from old uploads
-- (uncomment and run if you want to clean up)
-- DELETE FROM chapters WHERE book_id IN (SELECT id FROM books WHERE status IN ('processing', 'failed'));
-- DELETE FROM books WHERE status IN ('processing', 'failed');
