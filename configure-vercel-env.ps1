# Script para configurar variáveis de ambiente no Vercel
Write-Host "Configurando variáveis de ambiente no Vercel..."

# Variáveis do Supabase
$env:SUPABASE_URL = "https://ldfldwfvspclsnpgjgmv.supabase.co"
$env:SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzM1MjQsImV4cCI6MjA3NDg0OTUyNH0.I_c31K314-UdDKWG4YxMFePAqoVjHVU8wvGHZbX0a28"
$env:SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI3MzUyNCwiZXhwIjoyMDc0ODQ5NTI0fQ.vjoLmfwissSJZPddjiMBOQjIznyFPaAHkgpY8qGS1CE"

# Configurar variáveis no Vercel
Write-Host "1. Configurando SUPABASE_URL..."
echo $env:SUPABASE_URL | vercel env add SUPABASE_URL production

Write-Host "2. Configurando SUPABASE_ANON_KEY..."
echo $env:SUPABASE_ANON_KEY | vercel env add SUPABASE_ANON_KEY production

Write-Host "3. Configurando SUPABASE_SERVICE_ROLE_KEY..."
echo $env:SUPABASE_SERVICE_ROLE_KEY | vercel env add SUPABASE_SERVICE_ROLE_KEY production

Write-Host "4. Configurando NODE_ENV..."
echo "production" | vercel env add NODE_ENV production

Write-Host "5. Configurando PORT..."
echo "3000" | vercel env add PORT production

Write-Host "Configuração concluída!"