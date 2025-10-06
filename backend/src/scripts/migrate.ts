import 'dotenv/config';
import { supabaseAdmin } from '../services/supabaseClient';
import fs from 'fs';
import path from 'path';

interface Migration {
  id: string;
  name: string;
  sql: string;
  executed_at?: string;
}

class MigrationRunner {
  private migrationsPath: string;

  constructor() {
    this.migrationsPath = path.join(__dirname, '../../../database/migrations');
  }

  /**
   * Cria a tabela de migrações se não existir
   */
  private async ensureMigrationsTable(): Promise<void> {
    if (!supabaseAdmin) {
      throw new Error('Supabase Admin não configurado');
    }

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      throw new Error(`Erro ao criar tabela de migrações: ${error.message}`);
    }
  }

  /**
   * Obtém migrações já executadas
   */
  private async getExecutedMigrations(): Promise<string[]> {
    if (!supabaseAdmin) {
      throw new Error('Supabase Admin não configurado');
    }

    const { data, error } = await supabaseAdmin
      .from('migrations')
      .select('id')
      .order('executed_at', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar migrações executadas: ${error.message}`);
    }

    return data?.map(m => m.id) || [];
  }

  /**
   * Lê arquivos de migração do diretório
   */
  private async getMigrationFiles(): Promise<Migration[]> {
    if (!fs.existsSync(this.migrationsPath)) {
      console.log('Diretório de migrações não encontrado. Criando...');
      fs.mkdirSync(this.migrationsPath, { recursive: true });
      return [];
    }

    const files = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    const migrations: Migration[] = [];

    for (const file of files) {
      const filePath = path.join(this.migrationsPath, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      const id = file.replace('.sql', '');
      
      migrations.push({
        id,
        name: file,
        sql,
      });
    }

    return migrations;
  }

  /**
   * Executa uma migração
   */
  private async executeMigration(migration: Migration): Promise<void> {
    if (!supabaseAdmin) {
      throw new Error('Supabase Admin não configurado');
    }

    console.log(`Executando migração: ${migration.name}`);

    // Executar SQL da migração
    const { error: sqlError } = await supabaseAdmin.rpc('exec_sql', { 
      sql: migration.sql 
    });

    if (sqlError) {
      throw new Error(`Erro ao executar migração ${migration.name}: ${sqlError.message}`);
    }

    // Registrar migração como executada
    const { error: insertError } = await supabaseAdmin
      .from('migrations')
      .insert({
        id: migration.id,
        name: migration.name,
      });

    if (insertError) {
      throw new Error(`Erro ao registrar migração ${migration.name}: ${insertError.message}`);
    }

    console.log(`✅ Migração ${migration.name} executada com sucesso`);
  }

  /**
   * Executa todas as migrações pendentes
   */
  async runMigrations(): Promise<void> {
    try {
      console.log('🚀 Iniciando execução de migrações...');

      // Verificar se o Supabase Admin está configurado
      if (!supabaseAdmin) {
        console.error('❌ Supabase Admin não está configurado. Verifique as variáveis de ambiente.');
        process.exit(1);
      }

      // Garantir que a tabela de migrações existe
      await this.ensureMigrationsTable();

      // Obter migrações executadas e arquivos de migração
      const [executedMigrations, migrationFiles] = await Promise.all([
        this.getExecutedMigrations(),
        this.getMigrationFiles(),
      ]);

      console.log(`📁 Encontrados ${migrationFiles.length} arquivos de migração`);
      console.log(`✅ ${executedMigrations.length} migrações já executadas`);

      // Filtrar migrações pendentes
      const pendingMigrations = migrationFiles.filter(
        migration => !executedMigrations.includes(migration.id)
      );

      if (pendingMigrations.length === 0) {
        console.log('✅ Nenhuma migração pendente encontrada');
        return;
      }

      console.log(`📋 Encontradas ${pendingMigrations.length} migrações pendentes:`);
      pendingMigrations.forEach(m => console.log(`  - ${m.name}`));

      // Executar migrações pendentes
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }

      console.log('🎉 Todas as migrações foram executadas com sucesso!');
    } catch (error) {
      console.error('❌ Erro durante execução de migrações:', error);
      process.exit(1);
    }
  }

  /**
   * Cria uma nova migração
   */
  async createMigration(name: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const filename = `${timestamp}_${name.toLowerCase().replace(/\s+/g, '_')}.sql`;
    const filepath = path.join(this.migrationsPath, filename);

    const template = `-- Migration: ${name}
-- Created at: ${new Date().toISOString()}

-- Add your SQL here
-- Example:
-- CREATE TABLE example (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   name TEXT NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );
`;

    if (!fs.existsSync(this.migrationsPath)) {
      fs.mkdirSync(this.migrationsPath, { recursive: true });
    }

    fs.writeFileSync(filepath, template);
    console.log(`✅ Nova migração criada: ${filename}`);
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const migrationRunner = new MigrationRunner();

  switch (command) {
    case 'run':
      await migrationRunner.runMigrations();
      break;
    
    case 'create':
      const name = args[1];
      if (!name) {
        console.error('❌ Nome da migração é obrigatório');
        console.log('Uso: npm run migrate:create "nome da migração"');
        process.exit(1);
      }
      await migrationRunner.createMigration(name);
      break;
    
    default:
      console.log('Comandos disponíveis:');
      console.log('  npm run migrate:run    - Executa migrações pendentes');
      console.log('  npm run migrate:create "nome" - Cria nova migração');
      break;
  }
}

// Executar se for o módulo principal
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MigrationRunner };