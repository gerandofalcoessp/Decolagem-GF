# Configuração de Políticas RLS no Dashboard do Supabase

## Problema Identificado
As políticas RLS para o storage bucket 'documentos' não podem ser criadas via código devido a restrições de permissão ("must be owner of table objects"). É necessário configurá-las diretamente no dashboard do Supabase.

## Instruções para Configuração

### 1. Acessar o Dashboard do Supabase
- Acesse: https://supabase.com/dashboard
- Faça login na sua conta
- Selecione o projeto correto

### 2. Navegar para Storage
- No menu lateral, clique em "Storage"
- Clique em "Policies" (ou "Políticas")

### 3. Criar Políticas para o Bucket 'documentos'

#### Política de SELECT (Visualização)
```sql
CREATE POLICY "documentos_select_policy" ON storage.objects
FOR SELECT USING (bucket_id = 'documentos' AND auth.role() = 'authenticated');
```

#### Política de INSERT (Upload)
```sql
CREATE POLICY "documentos_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'documentos' AND auth.role() = 'authenticated');
```

#### Política de UPDATE (Atualização)
```sql
CREATE POLICY "documentos_update_policy" ON storage.objects
FOR UPDATE USING (bucket_id = 'documentos' AND auth.role() = 'authenticated');
```

#### Política de DELETE (Exclusão)
```sql
CREATE POLICY "documentos_delete_policy" ON storage.objects
FOR DELETE USING (bucket_id = 'documentos' AND auth.role() = 'authenticated');
```

### 4. Alternativa Mais Permissiva (se as acima não funcionarem)
Se as políticas específicas não funcionarem, tente uma política mais permissiva:

```sql
CREATE POLICY "documentos_all_access" ON storage.objects
FOR ALL USING (bucket_id = 'documentos');
```

### 5. Verificar RLS Habilitado
Certifique-se de que o RLS está habilitado na tabela `storage.objects`:
- Vá para "Database" > "Tables"
- Encontre a tabela `storage.objects`
- Verifique se "Row Level Security" está habilitado

## Teste Após Configuração
Após configurar as políticas no dashboard, execute:
```bash
node test-storage-rls.cjs
```

## Credenciais de Teste
- Email: test-rls-1759539127683@test.com
- Senha: TestRLS123!

## Status Atual
- ❌ Políticas não podem ser criadas via código
- ⏳ Aguardando configuração manual no dashboard
- ✅ Usuário de teste criado e funcionando
- ✅ Bucket 'documentos' configurado corretamente