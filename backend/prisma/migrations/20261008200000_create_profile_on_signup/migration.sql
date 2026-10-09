-- Create the `profiles` row in the database when Supabase Auth creates a user,
-- instead of the backend checking for it on every authenticated request
-- (previously AuthService.ensureProfile, called from JwtStrategy.validate).

-- SECURITY DEFINER: the insert into auth.users runs as the auth service role,
-- which has no privileges on public.profiles. search_path is pinned to '' so
-- every name below must be schema-qualified.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Not callable through the Data API (PostgREST exposes public functions as RPC).
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill users created before this trigger existed.
INSERT INTO public.profiles (id, name)
SELECT u.id, u.raw_user_meta_data ->> 'name'
FROM auth.users u
ON CONFLICT (id) DO NOTHING;
