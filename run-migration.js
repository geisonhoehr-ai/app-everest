const fetch = require('node-fetch');

const SUPABASE_URL = 'https://hnhzindsfuqnaxosujay.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuaHppbmRzZnVxbmF4b3N1amF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjkzNTk1MiwiZXhwIjoyMDY4NTExOTUyfQ.Fj2biXwZJNz-cqnma6_gJDMviVGo92ljDCIdFynojZ4';

const migration = `
-- APENAS ADICIONAR COLUNAS
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'quiz';
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMPTZ;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS scheduled_end TIMESTAMPTZ;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS passing_score INTEGER;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS show_results_immediately BOOLEAN DEFAULT true;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN DEFAULT false;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS shuffle_options BOOLEAN DEFAULT false;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS allow_review BOOLEAN DEFAULT true;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS created_by UUID;
`;

async function runMigration() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ query: migration })
    });

    const data = await response.text();
    console.log('Response:', data);
    console.log('Status:', response.status);

    if (response.ok) {
      console.log('✅ Migração executada com sucesso!');
    } else {
      console.error('❌ Erro ao executar migração');
    }
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

runMigration();
