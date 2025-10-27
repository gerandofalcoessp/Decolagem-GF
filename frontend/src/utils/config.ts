// Configurações centralizadas do frontend (sem alterar comportamento)
const envUrl = (import.meta.env.VITE_API_URL ?? '').trim();
const isProd = import.meta.env.PROD;

// Em produção, SEMPRE usar o mesmo domínio (Vercel Functions /api no mesmo projeto)
// Ignoramos VITE_API_URL para evitar CORS/404 em previews e aliases.
let base: string;
if (isProd) {
  base = window.location.origin; // mesmo domínio do Vercel
} else {
  // Em desenvolvimento, usar URL direta do backend se fornecida; caso contrário, localhost:4000
  base = envUrl || 'http://localhost:4000';
}

export const API_BASE_URL = base.replace(/\/+$/, '');