import { supabase, supabaseConfigError } from './supabaseClient';

function requireConfig() {
  if (supabaseConfigError) {
    throw new Error(supabaseConfigError);
  }
}

function unwrap({ data, error }) {
  if (error) throw new Error(error.message || 'Kimlik doğrulama işlemi tamamlanamadı.');
  return data;
}

export async function signUp({ name, email, password }) {
  requireConfig();
  return unwrap(
    await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } },
    }),
  );
}

export async function signIn({ email, password }) {
  requireConfig();
  return unwrap(await supabase.auth.signInWithPassword({ email: email.trim(), password }));
}

export async function signOut() {
  requireConfig();
  return unwrap(await supabase.auth.signOut());
}

export async function getSession() {
  requireConfig();
  return unwrap(await supabase.auth.getSession()).session;
}

export async function getCurrentUser() {
  requireConfig();
  return unwrap(await supabase.auth.getUser()).user;
}
