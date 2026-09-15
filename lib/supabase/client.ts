import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null | undefined;
let publicBrowserClient: SupabaseClient | null | undefined;

function getBrowserCredentials() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && publishableKey ? { url, publishableKey } : null;
}

export function getSupabaseClient() {
  if (browserClient !== undefined) return browserClient;

  const credentials = getBrowserCredentials();

  browserClient = credentials
    ? createClient(credentials.url, credentials.publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;

  return browserClient;
}

export function getPublicSupabaseClient() {
  if (publicBrowserClient !== undefined) return publicBrowserClient;
  const credentials = getBrowserCredentials();
  publicBrowserClient = credentials
    ? createClient(credentials.url, credentials.publishableKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      })
    : null;
  return publicBrowserClient;
}

export const BIRTHDAY_ASSETS_BUCKET = 'birthday-assets';
