// Configurações centralizadas do frontend (sem alterar comportamento)
const envUrl = (import.meta.env.VITE_API_URL ?? '').trim();
export const API_BASE_URL = (envUrl && envUrl.length > 0 ? envUrl : 'http://localhost:4000').replace(/\/+$/, '');