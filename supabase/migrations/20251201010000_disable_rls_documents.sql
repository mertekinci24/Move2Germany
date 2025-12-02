-- Disable RLS on documents table to allow ingestion script to write without permission issues
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
