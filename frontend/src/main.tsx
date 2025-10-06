import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

import App from './App.tsx'
import { ToastProvider } from './contexts/ToastContext.tsx'
import './index.css'

// Silenciar logs em produção para reduzir overhead e ruído no console
if (import.meta && import.meta.env && import.meta.env.PROD) {
  const noop = (..._args: unknown[]) => {};
  console.log = noop;
  console.debug = noop;
  console.info = noop;
  console.warn = noop; // adicional
}

console.log('🚀 Main: Iniciando aplicação React');

// Configuração do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 10, // 10 minutos (anteriormente cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

console.log('📦 Main: QueryClient configurado');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Main: Elemento root não encontrado!');
  throw new Error('Elemento root não encontrado');
}

console.log('✅ Main: Elemento root encontrado, renderizando aplicação');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ToastProvider>
          <App />
        </ToastProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#1f2937',
              boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e5e7eb',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)