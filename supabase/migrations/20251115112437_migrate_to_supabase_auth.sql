/*
  # Migrate to Supabase Auth System

  ## Summary
  This migration transitions from custom password hash system to Supabase's built-in 
  authentication system, which uses industry-standard security practices.

  ## Changes Made

  ### 1. User Table Schema Update
  - Remove `password_hash` column (auth handled by Supabase Auth)
  - Keep `id` as UUID to link with `auth.users`
  - Add migration tracking columns
  
  ### 2. Migration Strategy for Existing Users
  - Existing users marked as `needs_password_reset = true`
  - Users must reset password on next login through Supabase Auth
  - Old password_hash data preserved temporarily in `legacy_auth_backup` table
  - After 90 days, legacy data can be safely deleted

  ### 3. Security Improvements
  - Passwords now managed by Supabase (bcrypt by default)
  - Built-in rate limiting and security features
  - Email confirmation and password reset flows included
  - Multi-factor authentication ready

  ## Migration Path for Users
  1. Existing users will need to use "Forgot Password" flow
  2. They receive a password reset email from Supabase
  3. Set new password through secure Supabase flow
  4. After reset, full access is restored

  ## Important Notes
  - This is a breaking change for authentication
  - Frontend must be updated to use Supabase Auth methods
  - `password_hash` column will be dropped after backup
*/

-- Step 1: Create backup table for legacy auth data (for rollback safety)
CREATE TABLE IF NOT EXISTS legacy_auth_backup (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  password_hash text NOT NULL,
  migrated_at timestamptz DEFAULT now(),
  backed_up_at timestamptz DEFAULT now()
);

-- Step 2: Backup existing auth data
INSERT INTO legacy_auth_backup (id, email, password_hash)
SELECT id, email, password_hash 
FROM users
WHERE password_hash IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Step 3: Add migration tracking columns to users table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'needs_password_reset'
  ) THEN
    ALTER TABLE users ADD COLUMN needs_password_reset boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'migrated_to_supabase_auth'
  ) THEN
    ALTER TABLE users ADD COLUMN migrated_to_supabase_auth boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'migration_date'
  ) THEN
    ALTER TABLE users ADD COLUMN migration_date timestamptz;
  END IF;
END $$;

-- Step 4: Mark existing users as needing password reset
UPDATE users 
SET 
  needs_password_reset = true,
  migrated_to_supabase_auth = true,
  migration_date = now()
WHERE password_hash IS NOT NULL;

-- Step 5: Drop password_hash column (auth now handled by Supabase)
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- Step 6: Create helper function to sync Supabase auth users with our users table
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a new user signs up through Supabase Auth,
  -- create corresponding row in public.users table
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

-- Step 7: Create trigger on auth.users to auto-sync with public.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Step 8: Add RLS policy for legacy_auth_backup (admin/service role only)
ALTER TABLE legacy_auth_backup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can access legacy auth backup"
  ON legacy_auth_backup
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Step 9: Create cleanup function (to be run after 90 days)
CREATE OR REPLACE FUNCTION cleanup_legacy_auth_backup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete legacy auth data older than 90 days
  DELETE FROM legacy_auth_backup
  WHERE backed_up_at < now() - interval '90 days';
  
  RAISE NOTICE 'Legacy auth backup cleanup completed';
END;
$$;

-- Step 10: Add helpful comments
COMMENT ON TABLE legacy_auth_backup IS 'Temporary backup of old password hashes. Delete after 90 days using cleanup_legacy_auth_backup()';
COMMENT ON COLUMN users.needs_password_reset IS 'Users migrated from old system need to reset password';
COMMENT ON COLUMN users.migrated_to_supabase_auth IS 'Tracks if user has been migrated to Supabase Auth';
COMMENT ON FUNCTION handle_new_user() IS 'Syncs auth.users with public.users table';
COMMENT ON FUNCTION cleanup_legacy_auth_backup() IS 'Run after 90 days to remove legacy password hashes';