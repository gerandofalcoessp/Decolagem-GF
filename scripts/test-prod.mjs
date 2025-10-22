import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const vercelPath = path.join(__dirname, '..', 'vercel.json');
  const vercelJson = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
  const env = vercelJson.env || {};

  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;
  const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  const BASE_URL = 'https://decolagem-gf-backend.vercel.app';

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase env in vercel.json');
    process.exit(1);
  }

  const { createClient } = await import('@supabase/supabase-js');

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const email = `test.prod.${Date.now()}@example.com`;
  const password = 'Test1234!';

  console.log('creating_user:', email);
  const createRes = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  if (createRes.error) {
    console.error('createUser_error:', createRes.error.message);
    process.exit(1);
  }

  const signIn = await client.auth.signInWithPassword({ email, password });
  if (signIn.error) {
    console.error('signIn_error:', signIn.error.message);
    process.exit(1);
  }
  const token = signIn.data.session.access_token;
  console.log('token_len:', token.length);

  // Health check
  const resHealth = await fetch(`${BASE_URL}/api/health`);
  const txtHealth = await resHealth.text();
  console.log('health_status:', resHealth.status, 'body:', txtHealth);

  // GET regional-activities
  const resGet = await fetch(`${BASE_URL}/api/regional-activities`, {
    headers: { Authorization: 'Bearer ' + token }
  });
  const txtGet = await resGet.text();
  console.log('GET_status:', resGet.status, 'body_snippet:', txtGet.substring(0, 300));

  // POST regional-activities
  const payload = {
    programa: 'Decolagem',
    atividade: 'Teste produção via script',
    estados: ['RJ'],
    previsaoMes: 10,
    previsaoSemana: 2,
    realizadosMes: 0,
    realizadosSemana: 0
  };
  const resPost = await fetch(`${BASE_URL}/api/regional-activities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    body: JSON.stringify(payload)
  });
  const txtPost = await resPost.text();
  console.log('POST_status:', resPost.status, 'body_snippet:', txtPost.substring(0, 300));
}

main().catch((err) => {
  console.error('fatal_error:', err?.message || err);
  process.exit(1);
});