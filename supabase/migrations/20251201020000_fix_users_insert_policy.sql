-- Fix: Add missing INSERT policy for public.users
-- This allows authenticated users to create their own profile row during sign-up.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile" 
        ON public.users 
        FOR INSERT 
        TO authenticated 
        WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Ensure handle_new_user trigger exists (Idempotent check)
-- This trigger is crucial for syncing auth.users to public.users automatically.
-- If it was missing or dropped, we recreate it here.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NEW.created_at)
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    needs_password_reset = false,
    migrated_to_supabase_auth = true,
    migration_date = now();
  RETURN NEW;
END;
$$;

-- We cannot easily check for trigger existence on auth.users from a migration without potentially failing permissions
-- in some environments, but we will attempt to ensure it's set if possible.
-- Note: In local development, this usually works. In production, dashboard might be needed.

DO $$
BEGIN
  -- Check if trigger exists on auth.users (requires permissions)
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT OR UPDATE ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION handle_new_user();
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create trigger on auth.users. Ensure it exists manually if needed.';
END $$;
