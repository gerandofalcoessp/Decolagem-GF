import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const hasUrl = !!SUPABASE_URL;
const hasAnon = !!SUPABASE_ANON_KEY;
const hasService = !!SUPABASE_SERVICE_ROLE_KEY;

if (!hasUrl) {
  console.warn('[supabase] SUPABASE_URL não definido. Conexão ficará inativa.');
}

if (!hasAnon && !hasService) {
  console.warn('[supabase] Nenhuma chave definida (ANON ou SERVICE_ROLE). Conexão ficará inativa.');
}

// Cliente para operações seguras de servidor
export const supabaseAdmin = hasUrl && hasService
  ? createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
  : undefined;

// Cliente limitado (anon), útil para validações leves
export const supabase = hasUrl && hasAnon
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
  : undefined;

export function supabaseConfigStatus() {
  return {
    hasUrl,
    hasAnon,
    hasService,
    adminConfigured: !!supabaseAdmin,
    clientConfigured: !!supabase,
  };
}

export async function getUserFromToken(token?: string) {
  if (!token || !supabase) return null;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) return null;
    return data.user ?? null;
  } catch {
    return null;
  }
}

// Cria um cliente Supabase por requisição que opera sob o JWT do usuário
export function getSupabaseForToken(token?: string) {
  if (!token || !hasUrl || !hasAnon) return undefined;
  return createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, detectSessionInUrl: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}