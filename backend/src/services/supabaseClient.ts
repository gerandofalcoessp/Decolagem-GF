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

// Configurações otimizadas para connection pooling e performance
const optimizedConfig = {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'x-client-info': 'decolagem-gf-backend'
    }
  }
};

// Cliente para operações seguras de servidor com configurações otimizadas
export const supabaseAdmin = hasUrl && hasService
  ? createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, optimizedConfig)
  : undefined;

// Cliente limitado (anon) com configurações otimizadas
export const supabase = hasUrl && hasAnon
  ? createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, optimizedConfig)
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
  if (!token) return null;
  // Preferir cliente anon; caso não esteja configurado, usar admin como fallback
  const client = supabase ?? supabaseAdmin;
  if (!client) return null;
  try {
    const { data, error } = await client.auth.getUser(token);
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