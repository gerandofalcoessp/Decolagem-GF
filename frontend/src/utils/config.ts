// Configurações centralizadas do frontend (sem alterar comportamento)
const envUrl = (import.meta.env.VITE_API_URL ?? '').trim();
const isProd = import.meta.env.PROD;

function deriveBackendBaseFromOrigin(origin: string): string {
  try {
    const url = new URL(origin);
    // Regra: trocar "frontend" por "backend" no hostname
    const backendHost = url.hostname.replace('frontend', 'backend');
    return `${url.protocol}//${backendHost}`;
  } catch {
    return origin;
  }
}

let base = envUrl;
if (!base) {
  if (isProd) {
    // Em produção, se não houver VITE_API_URL, derivar o domínio do backend a partir do domínio do frontend
    const derived = deriveBackendBaseFromOrigin(window.location.origin);
    base = derived || window.location.origin;
  } else {
    // Em desenvolvimento, usar URL direta do backend para evitar problemas de proxy
    base = 'http://localhost:4000';
  }
}

export const API_BASE_URL = base.replace(/\/+$/, '');