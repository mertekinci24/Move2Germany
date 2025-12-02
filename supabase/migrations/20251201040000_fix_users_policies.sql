-- Comprehensive Fix for Users Table Policies
-- This migration drops and recreates all RLS policies for the public.users table to ensure consistency.

-- 1. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can do everything" ON public.users;

-- 2. Re-create policies with correct definitions
-- SELECT: Authenticated users can read their own profile
CREATE POLICY "Users can read own profile" 
ON public.users 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- INSERT: Authenticated users can insert their own profile (Crucial for sign-up)
CREATE POLICY "Users can insert own profile" 
ON public.users 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- UPDATE: Authenticated users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.users 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- SERVICE ROLE: Grant full access to service_role (Admin/Backend scripts)
CREATE POLICY "Service role can do everything" 
ON public.users 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
