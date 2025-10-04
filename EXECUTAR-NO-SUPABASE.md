# Como Executar a Migração no Supabase

## Passo a Passo

1. **Abrir Supabase Dashboard**
   - Acesse: https://supabase.com/dashboard
   - Entre no seu projeto

2. **Abrir SQL Editor**
   - No menu lateral esquerdo, clique em **SQL Editor**
   - Clique em **New Query** (ou "Nova Query")

3. **Copiar e Cola o SQL**
   - Abra o arquivo `execute-migrations.sql` (na raiz do projeto)
   - Copie TODO o conteúdo do arquivo (Ctrl+A, Ctrl+C)
   - Cole no editor SQL do Supabase (Ctrl+V)

4. **Executar**
   - Clique no botão **Run** (ou pressione Ctrl+Enter)
   - Aguarde a execução (pode levar alguns segundos)

5. **Verificar Sucesso**
   - Se aparecer "Success. No rows returned" ou similar → **SUCESSO!**
   - Se aparecer algum erro, copie a mensagem e me envie

## O que esta migração faz?

- ✅ Adiciona colunas necessárias na tabela `quizzes` (type, status, scheduled_start, etc.)
- ✅ Cria tabela `quiz_classes` (controle de acesso por turma)
- ✅ Cria tabela `quiz_reading_texts` (textos para interpretação)
- ✅ Cria tabela `quiz_attempts` (tentativas de simulados)
- ✅ Cria tabela `quiz_answers` (respostas dos alunos)
- ✅ Cria tabela `quiz_question_stats` (estatísticas das questões)
- ✅ Cria funções para:
  - Verificar acesso ao quiz (`can_user_access_quiz`)
  - Calcular resultado (`calculate_quiz_result`)
  - Submeter simulado (`submit_quiz_attempt`)
  - Validar cartão resposta (`validate_answer_sheet`)
- ✅ Configura RLS (Row Level Security) para todas as tabelas
- ✅ Cria Views para facilitar consultas

## Após executar

O sistema estará pronto para:
1. **Simulados Online** - Com timer, textos de leitura, e correção automática
2. **Cartões Resposta** - Para provas presenciais (professor cria gabarito, aluno preenche online)
