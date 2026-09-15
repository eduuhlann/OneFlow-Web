import { createClient } from '@supabase/supabase-js';
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carrega as variáveis de ambiente do .env e .env.local
dotenv.config({ path: resolve(process.cwd(), '.env') });
dotenv.config({ path: resolve(process.cwd(), '.env.local'), override: true });

// Usa a SERVICE_ROLE_KEY para contornar o RLS e ler todos os dados
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// URI do seu MongoDB (local ou Atlas)
const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const mongoDbName = 'oneflow_backup';

// ✅ Todas as tabelas do seu banco Supabase
const tablesToMigrate = [
  'profiles',
  'discipleship_groups',
  'discipleship_group_members',
  'discipleship_connections',
  'discipleship_notes',
  'discipleship_tasks',
  'discipleship_invites',
  'reading_progress',
  'chat_clear_history',
  'feedback',
];

async function migrate() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERRO: VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não estão definidas no .env.');
    process.exit(1);
  }

  if (!process.env.MONGODB_URI) {
    console.warn('⚠️  AVISO: Variável MONGODB_URI não encontrada no .env. Usando "mongodb://localhost:27017".');
  }

  console.log('🔌 Conectando ao Supabase com Service Role Key (bypass RLS)...');
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  const mongoClient = new MongoClient(mongoUrl);

  try {
    console.log('🔌 Conectando ao MongoDB...');
    await mongoClient.connect();
    console.log('✅ Conectado ao MongoDB!\n');
    const db = mongoClient.db(mongoDbName);

    let totalInserted = 0;
    let totalSkipped = 0;

    for (const tableName of tablesToMigrate) {
      console.log(`⏳ Lendo tabela "${tableName}"...`);

      const { data, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) {
        console.error(`  ❌ Erro ao ler "${tableName}": ${error.message}`);
        totalSkipped++;
        continue;
      }

      const count = data?.length ?? 0;
      if (count === 0) {
        console.log(`  ⏩ Tabela vazia, pulando.\n`);
        totalSkipped++;
        continue;
      }

      const collection = db.collection(tableName);

      // Limpa os dados antigos antes de inserir (evita duplicatas no backup)
      await collection.deleteMany({});

      const result = await collection.insertMany(data);
      console.log(`  ✅ ${result.insertedCount} registros salvos na coleção "${tableName}" do MongoDB.\n`);
      totalInserted += result.insertedCount;
    }

    console.log('─'.repeat(50));
    console.log(`🎉 Backup concluído!`);
    console.log(`   📦 Banco MongoDB: "${mongoDbName}"`);
    console.log(`   ✅ Total de registros salvos: ${totalInserted}`);
    console.log(`   ⏩ Tabelas puladas/vazias: ${totalSkipped}`);
    console.log('─'.repeat(50));

  } catch (err) {
    console.error('❌ Erro fatal:', err);
  } finally {
    await mongoClient.close();
    console.log('🔌 Conexão com MongoDB encerrada.');
  }
}

migrate();
