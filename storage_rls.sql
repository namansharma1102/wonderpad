-- Run this in your Supabase Dashboard -> SQL Editor to allow client-side uploads
-- This will fix the 413 Request Entity Too Large error

-- 1. Make sure the books bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('books', 'books', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow authenticated users to upload files to the books bucket
CREATE POLICY "Allow authenticated uploads" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'books' );

-- 3. Allow users to read their own books (if not public) or public books
CREATE POLICY "Allow public reading" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'books' );
