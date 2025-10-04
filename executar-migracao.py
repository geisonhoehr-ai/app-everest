import psycopg2
import sys

# Credenciais do Supabase
# Formato da connection string: postgresql://postgres:[SENHA]@db.hnhzindsfuqnaxosujay.supabase.co:5432/postgres

print("Para executar esta migração, você precisa da senha do banco de dados do Supabase.")
print("\n🔐 Para obter a senha:")
print("1. Vá em https://supabase.com/dashboard/project/hnhzindsfuqnaxosujay/settings/database")
print("2. Copie a 'Database Password' (senha do banco)")
print("3. Execute: python executar-migracao.py SENHA_AQUI")
print("\nOu execute manualmente o SQL no Dashboard do Supabase.")

if len(sys.argv) < 2:
    print("\n⚠️  Uso: python executar-migracao.py SENHA_DO_BANCO")
    sys.exit(1)

password = sys.argv[1]
conn_string = f"postgresql://postgres:{password}@db.hnhzindsfuqnaxosujay.supabase.co:5432/postgres"

migration_sql = """
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
"""

try:
    print("🔄 Conectando ao banco de dados...")
    conn = psycopg2.connect(conn_string)
    cursor = conn.cursor()

    print("🔄 Executando migração...")
    cursor.execute(migration_sql)
    conn.commit()

    print("✅ Migração executada com sucesso!")

    cursor.close()
    conn.close()
except Exception as e:
    print(f"❌ Erro: {e}")
    sys.exit(1)
