-- Fix storage policies for avatars bucket to allow uploads
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update avatars" ON storage.objects;

-- Allow authenticated users to upload avatars (any path in avatars bucket)
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- Allow authenticated users to update their avatars
CREATE POLICY "Authenticated users can update avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- Allow authenticated users to delete their avatars
CREATE POLICY "Authenticated users can delete avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');