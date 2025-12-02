-- Emergency Fix: Ensure "Users can insert own profile" policy exists
-- This file uses a later timestamp to force Supabase CLI to pick it up.

DO $$
BEGIN
    -- Check if the policy already exists to avoid errors
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
