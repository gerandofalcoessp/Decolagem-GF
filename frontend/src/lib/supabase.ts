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

// Função para verificar se o Supabase está configurado
export const isSupabaseConfigured = (): boolean => {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
};

// Criar cliente do Supabase apenas se as variáveis estiverem definidas
export const supabase = isSupabaseConfigured() 
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
  : null;

// Log de status da configuração
if (isSupabaseConfigured()) {
  console.log('[supabase] Cliente configurado com sucesso');
} else {
  console.warn('[supabase] Cliente não configurado - variáveis de ambiente ausentes');
}