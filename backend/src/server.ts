import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from './middlewares/authMiddleware';
import { supabaseAdmin, supabaseConfigStatus } from './services/supabaseClient';
import { supabase } from './services/supabaseClient';

// Routers
import membersRouter from './routes/members';
import activitiesRouter from './routes/activities';
import goalsRouter from './routes/goals';
import filesRouter from './routes/files';
import dbRouter from './routes/db';

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3001';

// Middlewares básicos
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));

// Healthcheck
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV ?? 'dev' });
});

// Rota raiz pública
app.get('/', (_req, res) => {
  res.json({ message: 'Decolagem Backend API' });
});

// Exemplo de rota protegida (requere Authorization: Bearer <token>)
app.get('/me', authMiddleware, (req, res) => {
  const user = (req as any).user;
  res.json({ user });
});

// Status da conexão com Supabase
app.get('/supabase/status', async (_req, res) => {
  try {
    const cfg = supabaseConfigStatus();
    let adminCheck: 'ok' | 'skipped' | 'error' = 'skipped';

    if (cfg.adminConfigured && supabaseAdmin) {
      const { error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
      if (error) {
        adminCheck = 'error';
        return res.status(500).json({ status: 'error', ...cfg, adminCheck, error: error.message });
      }
      adminCheck = 'ok';
    }

    return res.json({ status: 'ok', ...cfg, adminCheck });
  } catch (e: any) {
    return res.status(500).json({ status: 'error', error: e?.message ?? 'unknown_error' });
  }
});

// Monta routers de domínio (todas protegidas)
app.use('/members', authMiddleware, membersRouter);
app.use('/activities', authMiddleware, activitiesRouter);
app.use('/goals', authMiddleware, goalsRouter);
app.use('/files', authMiddleware, filesRouter);

// Validacoes de banco (público, apenas leitura de status)
app.use('/db', dbRouter);

// Rotas DEV: criar usuário de teste e retornar um JWT para validações
if (process.env.NODE_ENV !== 'production') {
  app.post('/dev/create-test-user', async (req, res) => {
    try {
      if (!supabaseAdmin || !supabase) {
        return res.status(500).json({ error: 'supabase_unavailable' });
      }

      const body = req.body || {};
      const email = body.email || `dev+${Date.now()}@example.com`;
      const password = body.password || 'Dev@123456';

      // Cria usuário já confirmado (apenas DEV)
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createErr) return res.status(400).json({ error: createErr.message });

      // Faz login para obter um JWT
      const { data: login, error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
      if (loginErr || !login?.session) return res.status(400).json({ error: loginErr?.message || 'login_failed' });

      const token = login.session.access_token;
      return res.status(201).json({ email, token });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'unknown_error' });
    }
  });
}

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});