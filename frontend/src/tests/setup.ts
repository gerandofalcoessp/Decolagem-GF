import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Estende os matchers do Vitest com os do Testing Library
expect.extend(matchers);

// Limpa após cada teste
afterEach(() => {
  cleanup();
});

// Mock do localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock do fetch
global.fetch = vi.fn();

// Mock do console para testes mais limpos (preservando saída por padrão)
const originalConsole = console;
const SILENCE_LOGS = process.env.VITEST_SILENCE_LOGS === 'true';

global.console = {
  ...originalConsole,
  log: SILENCE_LOGS ? vi.fn() : vi.fn((...args: any[]) => originalConsole.log(...args)),
  warn: SILENCE_LOGS ? vi.fn() : vi.fn((...args: any[]) => originalConsole.warn(...args)),
  info: SILENCE_LOGS ? vi.fn() : vi.fn((...args: any[]) => originalConsole.info(...args)),
  error: SILENCE_LOGS ? vi.fn() : vi.fn((...args: any[]) => originalConsole.error(...args)),
};

// Mock do window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock do ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock do IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

export {};