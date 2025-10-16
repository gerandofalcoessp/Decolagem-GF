// Utility for conditional logging based on environment
const isDevelopment = import.meta.env.DEV;

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  error: (...args: unknown[]) => {
    // Always log errors, even in production
    console.error(...args);
  },
  
  // For development-only logs with emojis
  dev: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  }
};

// Legacy support - can be gradually replaced
export const conditionalLog = (...args: unknown[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};