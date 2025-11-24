/*
  # Fix Community Foreign Keys
  
  Updates foreign keys in community tables to reference public.users instead of auth.users.
  This enables PostgREST to perform joins (e.g. fetching author email) which is not possible
  with direct references to auth.users.

  1. Changes
    - Drop existing FKs to auth.users
    - Add new FKs to public.users
    - Preserves ON DELETE behavior (SET NULL)
*/

-- Fix community_topics
ALTER TABLE community_topics
  DROP CONSTRAINT IF EXISTS community_topics_created_by_fkey;

ALTER TABLE community_topics
  ADD CONSTRAINT community_topics_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.users(id)
  ON DELETE SET NULL;

-- Fix community_replies
ALTER TABLE community_replies
  DROP CONSTRAINT IF EXISTS community_replies_created_by_fkey;

ALTER TABLE community_replies
  ADD CONSTRAINT community_replies_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.users(id)
  ON DELETE SET NULL;

-- Fix community_messages
ALTER TABLE community_messages
  DROP CONSTRAINT IF EXISTS community_messages_created_by_fkey;

ALTER TABLE community_messages
  ADD CONSTRAINT community_messages_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.users(id)
  ON DELETE SET NULL;
