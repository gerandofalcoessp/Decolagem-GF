# Sistema Decolagem - CRM Social + ERP Simplificado

## 📋 Visão Geral
Sistema de gestão web + mobile para acompanhar o ciclo completo de participantes em 3 programas:
- **As Maras** - Gestão de ONGs, líderes e formação de ligas
- **Microcrédito** - Aprovação e monitoramento de empréstimos
- **Decolagem** - Inclusão produtiva de famílias

## 🎯 Objetivos
- Acompanhar todo o ciclo das participantes (inscrição → relatórios de impacto)
- Padronizar cadastros, formalizações, diagnósticos e indicadores
- Dashboards modernos, responsivos e interativos
- Sistema de perfis (Super Admin, Equipe Interna)

## 🏗️ Arquitetura Técnica

### Backend
- **Framework**: NestJS (Node.js)
- **Banco de Dados**: PostgreSQL
- **Autenticação**: JWT
- **Documentação**: Swagger/OpenAPI

### Frontend
- **Framework**: React 18+ com TypeScript
- **Styling**: Tailwind CSS + Styled Components
- **Charts**: Chart.js / Recharts
- **State Management**: Zustand
- **Routing**: React Router v6

### Mobile
- **Framework**: React Native
- **Navigation**: React Navigation v6

## 🗺️ Regionais e Estados
- **Centro-Oeste**: DF, GO, MT, MS
- **MG/ES**: MG, ES
- **Nordeste 1**: CE, PB, RN, MA, PI
- **Nordeste 2**: BA, SE, PE, AL
- **Norte**: AC, AP, AM, PA, RO, RR, TO
- **RJ**: Rio de Janeiro
- **SP**: São Paulo
- **Sul**: RS, PR, SC

## 📊 Módulos Principais

### 1. Gestão As Maras
- Cadastro de participantes e ONGs
- Diagnóstico Decolagem (10 perguntas)
- Formação de Liga Maras (6 pessoas)
- Acompanhamento de metas e indicadores

### 2. Gestão Microcrédito
- Cadastro e aprovação de participantes
- Formalização e contratos
- Monitoramento e relatórios de impacto

### 3. Gestão Decolagem (Inclusão Produtiva)
- Cadastro de ONGs e famílias
- Configuração de metas (50 ONGs, 1000 famílias/ONG)
- Indicadores de retenção e NPS

### 4. Dashboards e Relatórios
- Dashboard Geral com filtros
- Dashboard de Metas por Regional
- Calendário de Atividades
- Relatórios de Impacto

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Backend
```bash
cd backend
npm install
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Mobile
```bash
cd mobile
npm install
npx react-native run-android # ou run-ios
```

## 🎨 Design System
- **Cor Principal**: Rosa (#E91E63)
- **Layout**: Moderno e minimalista
- **Responsividade**: Desktop, tablet, mobile
- **Componentes**: Reutilizáveis e acessíveis

## 📈 Indicadores Principais
- Número de ONGs por programa
- Total de Maras e Ligas formadas
- Taxa de retenção (meta: 90%)
- Inadimplência
- NPS (Net Promoter Score)
- Total de famílias atendidas

## 🔐 Perfis de Usuário
- **Super Admin**: Gestão completa do sistema
- **Equipe Interna**: Acesso a relatórios e registros

## 📝 Licença
Proprietary - Todos os direitos reservados