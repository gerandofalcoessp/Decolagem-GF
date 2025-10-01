# 🚀 Setup Automatizado - Decolagem System

Este guia fornece instruções para configurar automaticamente o ambiente de desenvolvimento do sistema Decolagem.

## 📋 Pré-requisitos

- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm 9+** - Incluído com Node.js
- **Docker** (opcional) - [Download](https://www.docker.com/get-started)
- **Git** - [Download](https://git-scm.com/)

## ⚡ Setup Rápido (Recomendado)

### Opção 1: Script Automatizado (Windows)
```powershell
# Execute o script de setup
.\scripts\setup.ps1
```

### Opção 2: Comandos Manuais
```bash
# 1. Instalar todas as dependências
npm run setup

# 2. Iniciar desenvolvimento
npm run dev
```

## 🔧 Configuração Detalhada

### 1. Clonar e Configurar
```bash
git clone https://github.com/gerandofalcoessp/Maras.git
cd Maras
```

### 2. Configurar Variáveis de Ambiente
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas configurações
# Abra o arquivo .env e configure:
# - DATABASE_URL
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - JWT_SECRET
```

### 3. Instalar Dependências
```bash
# Instalar todas as dependências (root, backend, frontend)
npm run install:all

# Ou instalar individualmente
npm run install:backend
npm run install:frontend
```

### 4. Configurar Banco de Dados
```bash
# Executar migrações
npm run db:migrate

# Executar seeds (dados iniciais)
npm run db:seed
```

## 🐳 Setup com Docker (Recomendado para Produção)

### Iniciar Todos os Serviços
```bash
# Subir PostgreSQL, Backend e Frontend
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

### Apenas Banco de Dados
```bash
# Apenas PostgreSQL
docker-compose up -d postgres
```

## 🚀 Comandos de Desenvolvimento

### Desenvolvimento Local
```bash
# Iniciar frontend + backend simultaneamente
npm run dev

# Iniciar apenas backend
npm run dev:backend

# Iniciar apenas frontend
npm run dev:frontend
```

### Build e Produção
```bash
# Build completo
npm run build

# Iniciar em modo produção
npm start
```

### Testes
```bash
# Executar todos os testes
npm test

# Testes em modo watch
npm run test:watch

# Testes apenas backend
npm run test:backend

# Testes apenas frontend
npm run test:frontend
```

### Qualidade de Código
```bash
# Verificar linting
npm run lint

# Corrigir problemas automaticamente
npm run lint:fix

# Formatar código
npm run format

# Verificar tipos TypeScript
npm run type-check
```

### Banco de Dados
```bash
# Executar migrações
npm run db:migrate

# Executar seeds
npm run db:seed

# Reset completo do banco
npm run db:reset
```

## 🔍 Verificação do Setup

### 1. Verificar Serviços
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001
- **API Docs:** http://localhost:3001/api-docs

### 2. Verificar Banco de Dados
```bash
# Testar conexão
npm run db:migrate
```

### 3. Executar Testes
```bash
npm test
```

## 🛠️ Solução de Problemas

### Erro: "Cannot connect to database"
```bash
# Verificar se PostgreSQL está rodando
docker-compose ps

# Reiniciar banco de dados
docker-compose restart postgres

# Verificar logs
docker-compose logs postgres
```

### Erro: "Port already in use"
```bash
# Verificar processos usando as portas
netstat -ano | findstr :3001
netstat -ano | findstr :5173

# Parar processos ou alterar portas no .env
```

### Erro: "Module not found"
```bash
# Reinstalar dependências
npm run clean
npm run install:all
```

### Problemas de Linting
```bash
# Corrigir automaticamente
npm run lint:fix

# Verificar configuração
npx eslint --print-config .
```

## 📁 Estrutura do Projeto

```
decolagem-system/
├── 📁 backend/          # API Node.js + TypeScript
├── 📁 frontend/         # React + TypeScript + Vite
├── 📁 scripts/          # Scripts de automação
├── 📁 .github/          # GitHub Actions + Templates
├── 📄 docker-compose.yml
├── 📄 .env.example
└── 📄 package.json      # Scripts principais
```

## 🔄 Fluxo de Desenvolvimento

1. **Criar branch:** `git checkout -b feature/nova-funcionalidade`
2. **Desenvolver:** `npm run dev`
3. **Testar:** `npm test`
4. **Lint:** `npm run lint:fix`
5. **Commit:** Git hooks executam verificações automaticamente
6. **Push:** GitHub Actions executa CI/CD

## 📚 Recursos Adicionais

- [Documentação da API](./backend/README.md)
- [Guia do Frontend](./frontend/README.md)
- [Contribuindo](./CONTRIBUTING.md)
- [Changelog](./CHANGELOG.md)

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os [Issues conhecidos](https://github.com/gerandofalcoessp/Maras/issues)
2. Execute o diagnóstico: `npm run setup -- --help`
3. Crie um [novo issue](https://github.com/gerandofalcoessp/Maras/issues/new/choose)

---

**✅ Após o setup, você terá um ambiente completo de desenvolvimento com:**
- ⚡ Hot reload para frontend e backend
- 🧪 Testes automatizados
- 🔍 Linting e formatação
- 🐳 Containerização com Docker
- 🚀 CI/CD com GitHub Actions