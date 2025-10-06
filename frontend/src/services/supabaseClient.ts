import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificar se as variáveis estão definidas
if (!SUPABASE_URL) {
  console.warn('[supabase] VITE_SUPABASE_URL não definido. Funcionalidades do Supabase ficarão inativas.');
}

if (!SUPABASE_ANON_KEY) {
  console.warn('[supabase] VITE_SUPABASE_ANON_KEY não definido. Funcionalidades do Supabase ficarão inativas.');
}

// Cliente Supabase para o frontend
export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Função para verificar se o Supabase está configurado
export function isSupabaseConfigured(): boolean {
  return !!supabase;
}

// Função para obter status da configuração
export function getSupabaseConfig() {
  return {
    hasUrl: !!SUPABASE_URL,
    hasAnonKey: !!SUPABASE_ANON_KEY,
    isConfigured: isSupabaseConfigured(),
  };
}