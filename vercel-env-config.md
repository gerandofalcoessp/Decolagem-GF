# Configurações de Ambiente para Vercel

## Variáveis que devem ser configuradas no painel do Vercel:

### Supabase Configuration
```
SUPABASE_URL=https://ldfldwfvspclsnpgjgmv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzM1MjQsImV4cCI6MjA3NDg0OTUyNH0.I_c31K314-UdDKWG4YxMFePAqoVjHVU8wvGHZbX0a28
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI3MzUyNCwiZXhwIjoyMDc0ODQ5NTI0fQ.vjoLmfwissSJZPddjiMBOQjIznyFPaAHkgpY8qGS1CE
```

### Production Configuration
```
NODE_ENV=production
PORT=3000
```

## Como configurar:

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto "decolagem-gf-frontend"
3. Vá em Settings → Environment Variables
4. Adicione cada variável acima
5. Faça redeploy

## Status:
- ✅ Frontend deployado: https://decolagem-gf-frontend.vercel.app/
- ❌ Backend não funciona (falta env vars)
- 🔄 Configuração em andamento