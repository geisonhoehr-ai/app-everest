# 📚 Instruções para Importar Questões de Quiz

**Data:** 2025-10-18
**Objetivo:** Popular banco de dados com questões reais de Português e Regulamentos

---

## 🎯 O que será feito

Vamos importar **25 questões de Português** do backup para o banco de dados atual:

- ✅ 10 questões de **Concordância**
- ✅ 5 questões de **Fonética e Fonologia**
- ✅ 5 questões de **Crase**
- ✅ 5 questões de **Regência** (quando adicionar)
- ✅ 5 questões de **Ortografia** (quando adicionar)

---

## 📋 Passo a Passo

### 1. Acessar Supabase SQL Editor

1. Abra seu projeto no Supabase: https://supabase.com
2. Vá em **SQL Editor** no menu lateral
3. Clique em **New Query**

### 2. Copiar e Executar o Script

1. Abra o arquivo: `scripts/import_quiz_questions.sql`
2. Copie **TODO o conteúdo** do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)

### 3. Verificar Resultado

Ao final da execução, você verá:

```
Matéria: Português
  ├─ Concordância (10 questões)
  ├─ Fonética e Fonologia (5 questões)
  └─ Crase (5 questões)

Total: 25 questões importadas ✅
```

### 4. Testar na Aplicação

1. Execute o app: `npm run dev`
2. Acesse: http://localhost:5173/quizzes
3. Você deve ver:
   - **Português** com 3 tópicos
   - Cada tópico com seu quiz
   - Total de questões correto

---

## ⚠️ Troubleshooting

### Se der erro: "column 'id' does not exist"

Significa que as tabelas esperam UUID auto-gerado. Remova os `id` fixos:

```sql
-- ❌ ERRADO:
INSERT INTO subjects (id, name, ...) VALUES ('portugues', 'Português', ...)

-- ✅ CORRETO:
INSERT INTO subjects (name, ...) VALUES ('Português', ...)
```

### Se der erro: "violates foreign key constraint"

Significa que está faltando uma tabela pai. Execute na ordem:
1. Primeiro `subjects`
2. Depois `topics`
3. Depois `quizzes`
4. Por último `quiz_questions`

### Se as questões não aparecerem

Verifique no console do browser (F12):
```
🔍 Fetching quiz subjects from database...
✅ Found subjects: 1
📚 Subject: Português, Topics: 3
  📖 Topic: Concordância, Quizzes: 1
```

---

## 🔍 Queries de Verificação

### Ver todas as matérias:
```sql
SELECT * FROM subjects;
```

### Ver todos os tópicos:
```sql
SELECT t.*, s.name as subject_name
FROM topics t
JOIN subjects s ON s.id = t.subject_id;
```

### Ver todos os quizzes com contagem:
```sql
SELECT
  q.title,
  t.name as topic,
  COUNT(qq.id) as questoes
FROM quizzes q
JOIN topics t ON t.id = q.topic_id
LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
GROUP BY q.title, t.name;
```

### Ver questões de um quiz específico:
```sql
SELECT
  question_text,
  correct_answer,
  points
FROM quiz_questions
WHERE quiz_id = 'quiz-concordancia';
```

---

## 📊 Estrutura de Dados

```
subjects (matérias)
  └─ id: 'portugues'
     name: 'Português'

     topics (tópicos)
       ├─ id: 'concordancia'
       │  name: 'Concordância'
       │
       │  quizzes
       │    └─ id: 'quiz-concordancia'
       │       title: 'Quiz de Concordância'
       │
       │       quiz_questions (10 questões)
       │         ├─ "Qual é a relação de harmonia..."
       │         ├─ "Em um sujeito simples..."
       │         └─ ...
       │
       ├─ id: 'fonetica-fonologia'
       │  name: 'Fonética e Fonologia'
       │
       │  quizzes
       │    └─ id: 'quiz-fonetica'
       │       quiz_questions (5 questões)
       │
       └─ id: 'crase'
          name: 'Crase'

          quizzes
            └─ id: 'quiz-crase'
               quiz_questions (5 questões)
```

---

## 🚀 Próximos Passos (Futuro)

Depois de importar Português, você pode adicionar **Regulamentos**:

1. Buscar questões no backup: `backup-2025-07-29-1518/scripts/097_import_regulamentos_flashcards.sql`
2. Converter flashcards em questões de quiz
3. Criar script similar: `import_regulamentos_quiz.sql`

---

## 📝 Notas Importantes

1. **IDs Fixos:** O script usa IDs fixos (ex: 'quiz-concordancia') para facilitar referência
2. **ON CONFLICT DO NOTHING:** Evita duplicatas se executar o script múltiplas vezes
3. **Question Type:** Todas questões são múltipla escolha (tipo padrão)
4. **Points:** Cada questão vale 10 pontos por padrão

---

## ✅ Checklist de Verificação

Após executar o script, confirme:

- [ ] Script executou sem erros
- [ ] Subjects criado: "Português"
- [ ] Topics criados: 3 (Concordância, Fonética, Crase)
- [ ] Quizzes criados: 3
- [ ] Questões criadas: 25 total
- [ ] App mostra os quizzes corretamente
- [ ] Console não mostra "⚠️ No quizzes found"

---

## 🐛 Debug

Se algo não funcionar:

1. **Abra o console** do browser (F12)
2. Vá na página `/quizzes`
3. Procure por mensagens:
   ```
   🔍 Fetching quiz subjects...
   ✅ Found subjects: X
   📚 Subject: ...
   ```

4. Se aparecer "⚠️ No quizzes found", verifique:
   - Tabela `subjects` tem dados?
   - Tabela `topics` tem `subject_id` correto?
   - Tabela `quizzes` tem `topic_id` correto?
   - Foreign keys estão corretas?

---

**Pronto para começar?** Execute o script e veja a mágica acontecer! ✨

---

**Criado por:** Claude Code Agent
**Arquivo:** `INSTRUCOES_IMPORTAR_QUIZZES.md`
**Script SQL:** `scripts/import_quiz_questions.sql`
