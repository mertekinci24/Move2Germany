/*
  # Fix Community Foreign Keys (V2)
  
  Updates foreign keys in community tables to reference public.users instead of auth.users.
  This enables PostgREST to perform joins (e.g. fetching author email).

  1. Changes
    - Drop existing FKs to auth.users on author_id
    - Add new FKs to public.users on author_id
    - Preserves ON DELETE behavior (CASCADE)
*/

-- Fix community_topics
DO $$
BEGIN
  -- Try to drop the constraint if it exists (name might vary, so we drop by column usage if possible, or standard name)
  -- Standard naming convention usually: table_column_fkey
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'community_topics_author_id_fkey') THEN
    ALTER TABLE community_topics DROP CONSTRAINT community_topics_author_id_fkey;
  END IF;
END $$;

ALTER TABLE community_topics
  ADD CONSTRAINT community_topics_author_id_fkey
  FOREIGN KEY (author_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- Fix community_replies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'community_replies_author_id_fkey') THEN
    ALTER TABLE community_replies DROP CONSTRAINT community_replies_author_id_fkey;
  END IF;
END $$;

ALTER TABLE community_replies
  ADD CONSTRAINT community_replies_author_id_fkey
  FOREIGN KEY (author_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;
