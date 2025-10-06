// Util de logger dev-only: em produção suprime debug/info/warn, mantém error
export const logger = {
  debug: (...args: any[]) => {
    if (import.meta?.env?.DEV) {
      // eslint-disable-next-line no-console
      console.debug(...args);
    }
  },
  info: (...args: any[]) => {
    if (import.meta?.env?.DEV) {
      // eslint-disable-next-line no-console
      console.info(...args);
    }
  },
  warn: (...args: any[]) => {
    if (import.meta?.env?.DEV) {
      // eslint-disable-next-line no-console
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // Sempre exibir erros
    // eslint-disable-next-line no-console
    console.error(...args);
  },
};