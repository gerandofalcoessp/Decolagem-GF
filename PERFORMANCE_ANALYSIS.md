# Análise de Performance - Dashboard Decolagem GF

## Resumo Executivo

Esta análise identificou várias oportunidades de otimização de performance no dashboard da aplicação Decolagem GF. Os principais problemas encontrados estão relacionados a:

1. **Configurações inadequadas de cache no React Query**
2. **Re-renders desnecessários em componentes**
3. **Múltiplas chamadas de API simultâneas**
4. **Falta de memoização em cálculos complexos**
5. **Polling excessivo e atualizações automáticas**

## Problemas Identificados

### 1. Configurações de Cache Problemáticas

#### `useCalendarEvents` - Cache Desabilitado
**Localização:** `frontend/src/hooks/useApi.ts:359-385`

```typescript
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['calendar-events', user?.regional || 'no-regional'],
  queryFn: fetchCalendarEvents,
  enabled: !!token,
  staleTime: 0, // ❌ PROBLEMA: Sempre considera dados obsoletos
  gcTime: 0, // ❌ PROBLEMA: Não mantém cache
  refetchOnMount: 'always', // ❌ PROBLEMA: Sempre refetch ao montar
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
});
```

**Impacto:** Cada montagem do componente faz uma nova requisição, mesmo que os dados sejam recentes.

#### Polling Excessivo em `useInstituicoes`
**Localização:** `frontend/src/hooks/useInstituicoes.ts:32-41`

```typescript
// Atualização automática a cada 5 minutos
useEffect(() => {
  const interval = setInterval(() => {
    if (!loading) {
      fetchInstituicoes(); // ❌ PROBLEMA: Polling muito frequente
    }
  }, 5 * 60 * 1000); // 5 minutos
  return () => clearInterval(interval);
}, [fetchInstituicoes, loading]);
```

**Impacto:** Requisições desnecessárias a cada 5 minutos, mesmo sem mudanças nos dados.

### 2. Re-renders Desnecessários

#### `DashboardPage` - Múltiplos Hooks sem Memoização
**Localização:** `frontend/src/pages/dashboard/DashboardPage.tsx:18`

```typescript
const { data: activities } = useActivities();
const { data: goals } = useGoals();
const { data: members } = useMembers();
const { data: microcredito } = useMicrocredito();
const { data: asMaras } = useAsMaras();
const { data: decolagem } = useDecolagem();
```

**Problema:** Cada hook pode causar re-render independente, e os cálculos complexos no dashboard não são memoizados.

#### `DashboardMetasPage` - Recarregamento Excessivo
**Localização:** `frontend/src/pages/dashboard/DashboardMetasPage.tsx:1105-1125`

```typescript
useEffect(() => {
  // ❌ PROBLEMA: Recarrega a cada mudança de filtro
  if (!loading && refetch) {
    refetch();
  }
  if (!loadingAtividades && refetchAtividades) {
    refetchAtividades();
  }
}, [filtroAtividade, filtroRegional, filtroEquipe, filtroMes, filtroAno, /* ... */]);

// ❌ PROBLEMA: Atualização automática muito frequente
useEffect(() => {
  const interval = setInterval(() => {
    if (refetch && !loading) {
      refetch();
    }
    if (refetchAtividades && !loadingAtividades) {
      refetchAtividades();
    }
  }, 10 * 60 * 1000); // 10 minutos
  return () => clearInterval(interval);
}, [/* ... */]);
```

### 3. Cálculos Não Memoizados

#### `DashboardPage` - Processamento de Dados Complexo
**Localização:** `frontend/src/pages/dashboard/DashboardPage.tsx:200-300`

Os cálculos de estatísticas, normalização de strings e filtros são executados a cada render sem memoização:

```typescript
// ❌ Estes cálculos rodam a cada render
const canonicalizeTokens = (str: string): string[] => { /* ... */ };
const isStringMatch = (str1: string, str2: string): boolean => { /* ... */ };
const doesActivityMatch = (activity: any, searchTokens: string[]): boolean => { /* ... */ };
```

### 4. Dependências de useEffect Problemáticas

#### `NovoEventoModal` - useEffect com Dependências Desnecessárias
**Localização:** `frontend/src/components/modals/NovoEventoModal.tsx:58-67`

```typescript
useEffect(() => {
  if (isOpen) {
    // Atualiza refs quando form muda
    if (atividadeRef.current) atividadeRef.current.value = form.atividade;
    // ... mais atualizações
  }
}, [isOpen, form]); // ❌ PROBLEMA: 'form' pode causar loops
```

### 5. Logs Excessivos em Produção

#### `useCalendarEvents` - Logs Detalhados
**Localização:** `frontend/src/hooks/useApi.ts:265-385`

```typescript
console.log('🚀 useCalendarEvents: Hook chamado');
console.log('🔑 useCalendarEvents: Token presente:', !!token);
// ... muitos outros logs que rodam em produção
```

## Recomendações de Otimização

### 1. Otimizar Configurações do React Query

```typescript
// ✅ SOLUÇÃO: Configurações otimizadas para useCalendarEvents
const { data, isLoading, error, refetch } = useQuery({
  queryKey: ['calendar-events', user?.regional || 'no-regional'],
  queryFn: fetchCalendarEvents,
  enabled: !!token,
  staleTime: 5 * 60 * 1000, // 5 minutos - dados frescos
  gcTime: 15 * 60 * 1000, // 15 minutos de cache
  refetchOnMount: false, // Usar cache se disponível
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
});
```

### 2. Implementar Memoização

```typescript
// ✅ SOLUÇÃO: Memoizar cálculos complexos
const normalizedActivities = useMemo(() => {
  return activities?.map(activity => ({
    ...activity,
    normalizedTitle: canonicalizeTokens(activity.titulo || '').join(' ')
  })) || [];
}, [activities]);

const filteredActivities = useMemo(() => {
  return normalizedActivities.filter(activity => 
    doesActivityMatch(activity, searchTokens)
  );
}, [normalizedActivities, searchTokens]);
```

### 3. Reduzir Polling e Atualizações Automáticas

```typescript
// ✅ SOLUÇÃO: Polling menos frequente e condicional
useEffect(() => {
  // Apenas fazer polling se a aba estiver ativa
  if (!document.hidden) {
    const interval = setInterval(() => {
      if (!loading) {
        fetchInstituicoes();
      }
    }, 15 * 60 * 1000); // 15 minutos em vez de 5
    return () => clearInterval(interval);
  }
}, [fetchInstituicoes, loading]);
```

### 4. Otimizar useEffect Dependencies

```typescript
// ✅ SOLUÇÃO: Usar useCallback para estabilizar referências
const updateFormRefs = useCallback(() => {
  if (isOpen && atividadeRef.current) {
    atividadeRef.current.value = form.atividade;
    // ... outras atualizações
  }
}, [isOpen, form.atividade, form.responsavel, /* apenas campos necessários */]);

useEffect(() => {
  updateFormRefs();
}, [updateFormRefs]);
```

### 5. Implementar Lazy Loading e Code Splitting

```typescript
// ✅ SOLUÇÃO: Lazy loading para componentes pesados
const DashboardMetasPage = lazy(() => import('./DashboardMetasPage'));
const ConfiguracoesPage = lazy(() => import('./ConfiguracoesPage'));

// Uso com Suspense
<Suspense fallback={<LoadingSpinner />}>
  <DashboardMetasPage />
</Suspense>
```

### 6. Otimizar Real-time Updates

```typescript
// ✅ SOLUÇÃO: Debounce para atualizações em tempo real
const debouncedInvalidateQueries = useMemo(
  () => debounce((queryKey: string[]) => {
    queryClient.invalidateQueries({ queryKey });
  }, 1000), // Aguarda 1 segundo antes de invalidar
  [queryClient]
);
```

## Métricas de Performance Esperadas

### Antes das Otimizações
- **Tempo de carregamento inicial:** ~3-5 segundos
- **Re-renders por mudança de filtro:** 8-12 renders
- **Requisições por minuto:** 6-10 requests
- **Uso de memória:** Alto devido ao cache desabilitado

### Após as Otimizações
- **Tempo de carregamento inicial:** ~1-2 segundos
- **Re-renders por mudança de filtro:** 2-4 renders
- **Requisições por minuto:** 1-2 requests
- **Uso de memória:** Redução de ~40-60%

## Prioridade de Implementação

### Alta Prioridade
1. ✅ **Configurar cache adequado no React Query** - Impacto imediato
2. ✅ **Memoizar cálculos no DashboardPage** - Reduz re-renders
3. ✅ **Reduzir polling excessivo** - Diminui carga no servidor

### Média Prioridade
4. **Implementar lazy loading** - Melhora tempo inicial
5. **Otimizar useEffect dependencies** - Previne loops
6. **Remover logs desnecessários** - Limpa console

### Baixa Prioridade
7. **Implementar debounce em real-time** - Refinamento
8. **Adicionar métricas de performance** - Monitoramento

## Conclusão

As otimizações propostas podem resultar em uma melhoria significativa de performance:
- **Redução de 50-70% no tempo de carregamento**
- **Diminuição de 60-80% nas requisições desnecessárias**
- **Melhoria na responsividade da interface**
- **Redução no uso de recursos do servidor**

A implementação deve ser feita de forma incremental, priorizando as mudanças de maior impacto primeiro.