// Configurações centralizadas do frontend (sem alterar comportamento)
const envUrl = (import.meta.env.VITE_API_URL ?? '').trim();
const isProd = import.meta.env.PROD;

let base = envUrl;
if (isProd) {
  // Em produção, sempre usar o mesmo domínio do frontend para evitar CORS
  base = window.location.origin;
} else if (!base) {
  // Em desenvolvimento, usar caminho relativo para aproveitar o proxy do Vite
  base = '';
}

export const API_BASE_URL = base.replace(/\/+$/, '');