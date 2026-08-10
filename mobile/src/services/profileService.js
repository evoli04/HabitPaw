import { supabase } from './supabaseClient';

export async function getProfile() {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const user = userData.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, created_at')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
