-- Storage object policies for avatar and note image uploads
-- Aligns write permissions with authenticated user identity while keeping avatar reads public.

-- ---------------------------------------------------------------------------
-- Avatars bucket
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
CREATE POLICY "Avatar public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar user insert own file" ON storage.objects;
CREATE POLICY "Avatar user insert own file"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND name = ((SELECT auth.uid())::text || '.png')
  );

DROP POLICY IF EXISTS "Avatar user update own file" ON storage.objects;
CREATE POLICY "Avatar user update own file"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND name = ((SELECT auth.uid())::text || '.png')
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND name = ((SELECT auth.uid())::text || '.png')
  );

DROP POLICY IF EXISTS "Avatar user delete own file" ON storage.objects;
CREATE POLICY "Avatar user delete own file"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND name = ((SELECT auth.uid())::text || '.png')
  );

-- ---------------------------------------------------------------------------
-- Notes images bucket (scoped by user folder prefix)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Notes images user read own prefix" ON storage.objects;
CREATE POLICY "Notes images user read own prefix"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'notes-images'
    AND split_part(name, '/', 1) = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "Notes images user insert own prefix" ON storage.objects;
CREATE POLICY "Notes images user insert own prefix"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'notes-images'
    AND split_part(name, '/', 1) = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "Notes images user update own prefix" ON storage.objects;
CREATE POLICY "Notes images user update own prefix"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'notes-images'
    AND split_part(name, '/', 1) = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'notes-images'
    AND split_part(name, '/', 1) = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "Notes images user delete own prefix" ON storage.objects;
CREATE POLICY "Notes images user delete own prefix"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'notes-images'
    AND split_part(name, '/', 1) = (SELECT auth.uid())::text
  );

-- ---------------------------------------------------------------------------
-- Annotated bucket (scoped by user folder prefix)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Annotated user read own prefix" ON storage.objects;
CREATE POLICY "Annotated user read own prefix"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'annotated'
    AND split_part(name, '/', 1) = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "Annotated user insert own prefix" ON storage.objects;
CREATE POLICY "Annotated user insert own prefix"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'annotated'
    AND split_part(name, '/', 1) = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "Annotated user update own prefix" ON storage.objects;
CREATE POLICY "Annotated user update own prefix"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'annotated'
    AND split_part(name, '/', 1) = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'annotated'
    AND split_part(name, '/', 1) = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "Annotated user delete own prefix" ON storage.objects;
CREATE POLICY "Annotated user delete own prefix"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'annotated'
    AND split_part(name, '/', 1) = (SELECT auth.uid())::text
  );
