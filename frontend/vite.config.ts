import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: '.', // Definir explicitamente o root
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/store': path.resolve(__dirname, './src/store'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/assets': path.resolve(__dirname, './src/assets'),
    },
  },
  server: {
      port: 3002,
      host: true,
      open: true,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
  },
  preview: {
    port: 3002,
    host: true,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Desabilitar sourcemaps em produção para reduzir tamanho
    chunkSizeWarningLimit: 1000, // Aumentar limite de warning para chunks
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          charts: ['recharts', 'chart.js', 'react-chartjs-2'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          supabase: ['@supabase/supabase-js'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          utils: ['date-fns', 'clsx', 'tailwind-merge'],
          icons: ['lucide-react'],
          query: ['@tanstack/react-query'],
        },
        // Otimizar nomes de arquivos para melhor cache
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  optimizeDeps: {
    entries: ['index.html', './src/main.tsx'],
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query', 'lucide-react'],
    // Forçar pré-bundling de dependências comuns
    force: false,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
})