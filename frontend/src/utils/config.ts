// Configurações centralizadas do frontend (sem alterar comportamento)
const envUrl = (import.meta.env.VITE_API_URL ?? '').trim();
const isProd = import.meta.env.PROD;

// Em produção, o frontend deve chamar a API no mesmo domínio (Vercel Functions /api)
// Removemos a derivação automática que trocava "frontend" por "backend"
// para evitar CORS/404 quando o backend está deployado como função dentro do mesmo projeto.
let base = envUrl;
if (!base) {
  if (isProd) {
    base = window.location.origin; // mesmo domínio do Vercel
  } else {
    // Em desenvolvimento, usar URL direta do backend para evitar problemas de proxy
    base = 'http://localhost:4000';
  }
}

export const API_BASE_URL = base.replace(/\/+$/, '');