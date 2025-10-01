# Script de Setup Automatizado - Decolagem System
# Este script configura automaticamente o ambiente de desenvolvimento

param(
    [switch]$SkipDocker,
    [switch]$SkipDatabase,
    [string]$Environment = "development"
)

Write-Host "🚀 Iniciando setup do Decolagem System..." -ForegroundColor Green

# Verificar se Node.js está instalado
Write-Host "📋 Verificando pré-requisitos..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado. Por favor, instale o Node.js 18+ primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se Docker está instalado (se não for para pular)
if (-not $SkipDocker) {
    try {
        $dockerVersion = docker --version
        Write-Host "✅ Docker encontrado: $dockerVersion" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Docker não encontrado. Pulando configuração Docker..." -ForegroundColor Yellow
        $SkipDocker = $true
    }
}

# Criar arquivo .env se não existir
Write-Host "🔧 Configurando variáveis de ambiente..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Arquivo .env criado a partir do .env.example" -ForegroundColor Green
        Write-Host "⚠️ IMPORTANTE: Edite o arquivo .env com suas configurações reais!" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Arquivo .env.example não encontrado!" -ForegroundColor Red
    }
} else {
    Write-Host "✅ Arquivo .env já existe" -ForegroundColor Green
}

# Instalar dependências
Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
try {
    npm run install:all
    Write-Host "✅ Dependências instaladas com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao instalar dependências!" -ForegroundColor Red
    exit 1
}

# Configurar banco de dados (se não for para pular)
if (-not $SkipDatabase) {
    Write-Host "🗄️ Configurando banco de dados..." -ForegroundColor Yellow
    
    if (-not $SkipDocker) {
        # Subir PostgreSQL via Docker
        Write-Host "🐳 Iniciando PostgreSQL via Docker..." -ForegroundColor Yellow
        docker-compose up -d postgres
        Start-Sleep -Seconds 10
    }
    
    try {
        npm run db:migrate
        Write-Host "✅ Migrações executadas com sucesso!" -ForegroundColor Green
        
        npm run db:seed
        Write-Host "✅ Seeds executados com sucesso!" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Erro na configuração do banco de dados. Verifique as configurações." -ForegroundColor Yellow
    }
}

# Executar testes para verificar se tudo está funcionando
Write-Host "🧪 Executando testes..." -ForegroundColor Yellow
try {
    npm run test
    Write-Host "✅ Todos os testes passaram!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Alguns testes falharam. Verifique os logs acima." -ForegroundColor Yellow
}

# Verificar linting
Write-Host "🔍 Verificando qualidade do código..." -ForegroundColor Yellow
try {
    npm run lint
    Write-Host "✅ Código está seguindo os padrões!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Problemas de linting encontrados. Execute 'npm run lint:fix' para corrigir automaticamente." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Setup concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Edite o arquivo .env com suas configurações" -ForegroundColor White
Write-Host "2. Execute 'npm run dev' para iniciar o desenvolvimento" -ForegroundColor White
Write-Host "3. Acesse http://localhost:5173 (frontend) e http://localhost:3001 (backend)" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Comandos úteis:" -ForegroundColor Cyan
Write-Host "- npm run dev          # Inicia frontend + backend" -ForegroundColor White
Write-Host "- npm run docker:up    # Inicia todos os serviços via Docker" -ForegroundColor White
Write-Host "- npm run test:watch   # Executa testes em modo watch" -ForegroundColor White
Write-Host "- npm run lint:fix     # Corrige problemas de linting" -ForegroundColor White
Write-Host ""