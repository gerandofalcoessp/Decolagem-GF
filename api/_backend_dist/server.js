import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { authMiddleware } from './middlewares/authMiddleware.js';
import { supabaseAdmin, supabaseConfigStatus } from './services/supabaseClient.js';
import { supabase } from './services/supabaseClient.js';
import { requestLogger } from './middleware/requestLogger.js';
// Routers
import authRouter from './routes/auth.js';
import membersRouter from './routes/members.js';
import activitiesRouter from './routes/activities.js';
import regionalActivitiesRouter from './routes/regional-activities.js';
import calendarEventsRouter from './routes/calendar-events.js';
import goalsRouter from './routes/goals.js';
import filesRouter from './routes/files.js';
import dbRouter from './routes/db.js';
import microcreditoRouter from './routes/microcredito.js';
import asmarasRouter from './routes/asmaras.js';
import decolagemRouter from './routes/decolagem.js';
import regionalsRouter from './routes/regionals.js';
import instituicoesRouter from './routes/instituicoes.js';
const app = express();
const PORT = Number(process.env.PORT) || 3002;
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL ?? '';
const isProd = process.env.NODE_ENV === 'production';
const allowedDevOrigins = [
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3005',
    'http://localhost:3012',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:8081',
];
// Deriva o slug do projeto Vercel a partir de FRONTEND_URL ou CORS_ORIGIN
const getVercelProjectSlug = () => {
    try {
        const baseUrl = FRONTEND_URL || CORS_ORIGIN;
        if (!baseUrl)
            return null;
        const u = new URL(baseUrl);
        const host = u.hostname.toLowerCase();
        if (!host.endsWith('.vercel.app'))
            return null;
        return host.replace('.vercel.app', '');
    }
    catch {
        return null;
    }
};
const allowPreviewFrontend = (origin) => {
    if (!origin)
        return true;
    try {
        const o = origin.toLowerCase();
        // Permite domínio estável via env
        if (CORS_ORIGIN && o === CORS_ORIGIN.toLowerCase())
            return true;
        // Permite qualquer alias de preview do mesmo projeto Vercel
        const projectSlug = getVercelProjectSlug();
        if (projectSlug && o.startsWith(`https://${projectSlug}`) && o.endsWith('.vercel.app')) {
            return true;
        }
    }
    catch { }
    return false;
};
// Configuração de CORS (produção suporta domains de Preview/aliases)
const corsOptions = {
    origin: (origin, callback) => {
        if (!isProd) {
            const ok = !origin || allowedDevOrigins.includes(origin);
            return callback(null, ok);
        }
        const ok = allowPreviewFrontend(origin);
        return callback(null, ok);
    },
    credentials: true
};
// Middlewares básicos
app.use(helmet());
app.use(cors(corsOptions));
// Suporte explícito à preflight (OPTIONS) para todas as rotas
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(requestLogger); // Adicionar logging estruturado
app.use(morgan('dev'));
// Rate limiting mais flexível para desenvolvimento
const rateLimitConfig = process.env.NODE_ENV === 'production'
    ? { windowMs: 60 * 1000, max: 100 } // Produção: 100 req/min
    : { windowMs: 60 * 1000, max: 1000 }; // Desenvolvimento: 1000 req/min
app.use(rateLimit(rateLimitConfig));
// Healthcheck
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', env: process.env.NODE_ENV ?? 'dev' });
});
// Also expose health under /api for Vercel
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', env: process.env.NODE_ENV ?? 'dev' });
});
// Rota raiz pública (somente quando NÃO servindo o frontend)
if (process.env.SERVE_FRONTEND !== 'true') {
    app.get('/', (_req, res) => {
        res.json({ message: 'Decolagem Backend API' });
    });
}
// Exemplo de rota protegida (requere Authorization: Bearer <token>)
app.get('/me', authMiddleware, (req, res) => {
    const user = req.user;
    res.json({ user });
});
// Status da conexão com Supabase
app.get('/supabase/status', async (_req, res) => {
    try {
        const cfg = supabaseConfigStatus();
        let adminCheck = 'skipped';
        if (cfg.adminConfigured && supabaseAdmin) {
            const { error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
            if (error) {
                adminCheck = 'error';
                return res.status(500).json({ status: 'error', ...cfg, adminCheck, error: error.message });
            }
            adminCheck = 'ok';
        }
        return res.json({ status: 'ok', ...cfg, adminCheck });
    }
    catch (e) {
        return res.status(500).json({ status: 'error', error: e?.message ?? 'unknown_error' });
    }
});
// Rotas protegidas (requerem autenticação)
app.use('/api/auth', authRouter);
app.use('/api/members', authMiddleware, membersRouter);
app.use('/api/activities', authMiddleware, activitiesRouter);
app.use('/api/atividades', authMiddleware, activitiesRouter); // Portuguese alias for activities

// Handlers públicos (somente leitura) para GET sem Authorization
app.get('/api/regional-activities', async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        if (authHeader) return next();
        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'supabase_unavailable' });
        }
        const { data, error } = await supabaseAdmin
            .from('regional_activities')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data || []);
    } catch (e) {
        return res.status(500).json({ error: e?.message || 'internal_server_error' });
    }
});

app.get('/api/asmaras', async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        if (authHeader) return next();
        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'supabase_unavailable' });
        }
        const { data, error } = await supabaseAdmin
            .from('participantes_asmaras')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data || []);
    } catch (e) {
        return res.status(500).json({ error: e?.message || 'internal_server_error' });
    }
});

app.get('/api/microcredito', async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        if (authHeader) return next();
        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'supabase_unavailable' });
        }
        const { data, error } = await supabaseAdmin
            .from('emprestimos')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data || []);
    } catch (e) {
        return res.status(500).json({ error: e?.message || 'internal_server_error' });
    }
});

app.get('/api/goals', async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        if (authHeader) return next();
        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'supabase_unavailable' });
        }
        const { data, error } = await supabaseAdmin
            .from('goals')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) return res.status(500).json({ error: error.message });
        return res.json({ data: data || [] });
    } catch (e) {
        return res.status(500).json({ error: e?.message || 'internal_server_error' });
    }
});

app.get('/api/decolagem', async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        if (authHeader) return next();
        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'supabase_unavailable' });
        }
        const { data, error } = await supabaseAdmin
            .from('familias_decolagem')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) return res.status(500).json({ error: error.message });
        return res.json(data || []);
    } catch (e) {
        return res.status(500).json({ error: e?.message || 'internal_server_error' });
    }
});

// Rotas protegidas (requerem autenticação)
app.use('/api/regional-activities', authMiddleware, regionalActivitiesRouter);
app.use('/api/calendar-events', authMiddleware, calendarEventsRouter);
app.use('/api/goals', authMiddleware, goalsRouter);
app.use('/api/files', authMiddleware, filesRouter);
app.use('/api/regionals', authMiddleware, regionalsRouter);
app.use('/api/microcredito', authMiddleware, microcreditoRouter);
app.use('/api/asmaras', authMiddleware, asmarasRouter);
app.use('/api/decolagem', authMiddleware, decolagemRouter);
app.use('/api/instituicoes', authMiddleware, instituicoesRouter);
app.use('/api/ongs', authMiddleware, instituicoesRouter); // Alias for instituicoes
// Validacoes de banco (público, apenas leitura de status)
app.use('/api/db', dbRouter);
// Rotas DEV: criar usuário de teste e retornar um JWT para validações
const allowDevEndpoints = process.env.ALLOW_DEV_ENDPOINTS === 'true';
if (allowDevEndpoints) {
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
            if (createErr)
                return res.status(400).json({ error: createErr.message });
            // Faz login para obter um JWT
            const { data: login, error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
            if (loginErr || !login?.session)
                return res.status(400).json({ error: loginErr?.message || 'login_failed' });
            const token = login.session.access_token;
            return res.status(201).json({ email, token });
        }
        catch (e) {
            return res.status(500).json({ error: e?.message || 'unknown_error' });
        }
    });
}
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
if (!isVercel) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Backend rodando em http://localhost:${PORT}`);
    });
}
// Serve frontend estático na mesma porta (opcional via ENV)
if (process.env.SERVE_FRONTEND === 'true') {
    const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
    app.use(express.static(frontendDistPath));
    // Rota raiz deve servir o index.html do SPA
    app.get('/', (_req, res) => {
        res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
    // SPA fallback: qualquer rota não-API retorna index.html
    app.get('*', (_req, res) => {
        res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
}
export default app;
