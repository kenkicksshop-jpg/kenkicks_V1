// Run these SQL queries in your Supabase SQL Editor to resolve the security warnings.

//export const resolveSQL = \`
-- 1. Resolve mutable search_path issue 
-- Function public.handle_new_user has a role mutable search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 2. Resolve execute permissions for anon and authenticated 
-- Function public.handle_new_user() can be executed by the anon/authenticated role
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;


-- 3. Resolve broad SELECT policy on public bucket
-- Public bucket products has 1 broad SELECT policy on storage.objects
DROP POLICY IF EXISTS "Product images are public" ON storage.objects;
\`;

