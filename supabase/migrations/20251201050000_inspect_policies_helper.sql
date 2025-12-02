-- Helper function to inspect policies
CREATE OR REPLACE FUNCTION inspect_policies(table_name_param text)
RETURNS TABLE (
    policyname name,
    tablename name,
    roles name[],
    cmd text,
    qual text,
    with_check text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.policyname,
        p.tablename,
        p.roles,
        p.cmd,
        p.qual::text,
        p.with_check::text
    FROM pg_policies p
    WHERE p.tablename = table_name_param;
END;
$$;
