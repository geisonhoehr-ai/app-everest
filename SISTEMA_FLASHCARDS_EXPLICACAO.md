# 📚 Sistema de Flashcards - Documentação Completa

## 🎯 Como Funciona o Sistema de Dificuldade

### Fluxo do Aluno

1. **Ver a Pergunta**: O aluno vê apenas a pergunta do flashcard
2. **Pensar na Resposta**: O aluno tenta lembrar a resposta
3. **Mostrar Resposta**: Clica em "Mostrar Resposta" e vê a resposta correta
4. **Auto-Avaliação**: O aluno escolhe a dificuldade baseado em como foi para ele:

### 🎨 Opções de Dificuldade (Auto-Avaliação)

| Botão | Quality | Significado | Contabiliza Como |
|-------|---------|-------------|------------------|
| 🔴 **Difícil** | 1 | Errei ou tive muita dificuldade | ❌ INCORRETO |
| 🟡 **Médio** | 3 | Acertei mas demorei a lembrar | ✅ CORRETO |
| 🟢 **Fácil** | 5 | Acertei facilmente | ✅ CORRETO |

### 📊 Cálculo de Resultados

```typescript
// Lógica de classificação:
if (quality <= 2) {
  resultado = 'INCORRETO'
} else {
  resultado = 'CORRETO'
}

// Porcentagem final:
porcentagem = (acertos / total_cards) * 100
```

**Exemplo prático:**
- Total de cards: 10
- Difícil (quality 1): 1 card → conta como ERRO
- Médio (quality 3): 4 cards → conta como ACERTO
- Fácil (quality 5): 5 cards → conta como ACERTO
- **Resultado**: 9 acertos de 10 = 90%

---

## 🧠 Sistema de Repetição Espaçada (Spaced Repetition)

### O que acontece com cada nível de dificuldade?

O sistema usa o algoritmo **SM-2 (SuperMemo 2)** adaptado para calcular quando o card deve aparecer novamente:

```typescript
export const updateFlashcardProgress = async (
  userId: string,
  flashcardId: string,
  quality: number  // 1=Difícil, 3=Médio, 5=Fácil
)
```

### 📅 Intervalos de Repetição

| Quality | Dificuldade | Próxima Revisão | Efeito no EF |
|---------|-------------|-----------------|--------------|
| 1 | Difícil | **1 dia** | EF diminui muito |
| 2 | Difícil | **1 dia** | EF diminui |
| 3 | Médio | **6 dias** (calculado) | EF mantém |
| 4 | Fácil | **Longo prazo** | EF aumenta |
| 5 | Fácil | **Muito longo prazo** | EF aumenta muito |

**EF (Easiness Factor)**: Fator que determina o quão fácil o card é para você
- Começa em 2.5
- Diminui quando você marca como "Difícil"
- Aumenta quando você marca como "Fácil"

### 🔄 Algoritmo Completo

```typescript
// Cálculo do intervalo (simplificado):
if (quality < 3) {
  // Marcou como difícil - reinicia
  interval = 1 dia
  repetitions = 0
} else {
  // Marcou como médio ou fácil
  if (repetitions == 0) interval = 1 dia
  else if (repetitions == 1) interval = 6 dias
  else interval = previous_interval * EF

  repetitions++
}

// Atualiza EF baseado na qualidade:
EF = EF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
```

---

## 🎮 Modos de Estudo

### 1. Sessão Completa
- Mostra cards aleatórios do tópico
- Quantidade escolhida pelo aluno (10, 20, 30 ou todos)
- **Ideal para**: Primeiro contato com o conteúdo

### 2. Revisão de Difíceis
- Mostra apenas cards que o aluno marcou como "Difícil" anteriormente
- Filtra cards com `quality <= 2` nas sessões anteriores
- **Ideal para**: Fortalecer pontos fracos

---

## 💾 O que é Salvo no Banco de Dados

### Tabela: `flashcard_progress`
Cada vez que o aluno responde um card:

```sql
INSERT INTO flashcard_progress (
  user_id,
  flashcard_id,
  easiness_factor,     -- Fator de facilidade (1.3 a 2.5+)
  repetitions,         -- Quantas vezes acertou seguidas
  interval_days,       -- Dias até próxima revisão
  next_review_date,    -- Data da próxima revisão
  last_reviewed_at,    -- Última vez que viu
  quality              -- 1=Difícil, 3=Médio, 5=Fácil
)
```

### Tabela: `flashcard_session_history`
Ao finalizar uma sessão:

```sql
INSERT INTO flashcard_session_history (
  user_id,
  topic_id,
  session_mode,          -- 'full' ou 'difficult_review'
  cards_reviewed,        -- Total de cards vistos
  correct_answers,       -- Quantos marcou Médio/Fácil
  incorrect_answers,     -- Quantos marcou Difícil
  ended_at
)
```

---

## 🎯 Importância de Cada Nível

### 🔴 Difícil (Quality 1)
**Quando usar**:
- Você errou completamente
- Não lembrava nada da resposta
- Precisa estudar mais esse conceito

**O que acontece**:
- ❌ Conta como ERRO nas estatísticas
- 📅 Card volta em **1 dia**
- 📉 Diminui o EF (fica mais fácil de aparecer)
- 🔄 Reseta o contador de repetições

### 🟡 Médio (Quality 3)
**Quando usar**:
- Você acertou mas demorou
- Teve que pensar bastante
- Não tem 100% de certeza

**O que acontece**:
- ✅ Conta como ACERTO nas estatísticas
- 📅 Card volta em **6 dias** (ou mais)
- ➡️ Mantém o EF
- ✔️ Incrementa repetições

### 🟢 Fácil (Quality 5)
**Quando usar**:
- Você sabia a resposta imediatamente
- Tem total domínio do conceito
- Resposta veio automaticamente

**O que acontece**:
- ✅ Conta como ACERTO nas estatísticas
- 📅 Card volta em **intervalo longo** (semanas/meses)
- 📈 Aumenta o EF
- ⭐ Incrementa repetições

---

## 🎓 Recomendações para os Alunos

### ✅ Boas Práticas

1. **Seja honesto na auto-avaliação**: O sistema só funciona se você for honesto sobre sua dificuldade
2. **Não marque tudo como "Fácil"**: Isso vai fazer os cards demorarem muito para voltar
3. **Use "Difícil" sem medo**: É melhor rever mais vezes do que esquecer
4. **Estude todos os dias**: O sistema de repetição espaçada funciona melhor com consistência

### ❌ Evite

1. **Chutar sem pensar**: Sempre tente lembrar antes de ver a resposta
2. **Marcar tudo igual**: Use os 3 níveis conforme sua real dificuldade
3. **Pular dias**: O sistema calcula as datas de revisão, mantenha a regularidade

---

## 📈 Estatísticas e Performance

### Níveis de Performance

| Porcentagem | Nível | Significado |
|-------------|-------|-------------|
| 90-100% | 🏆 Excepcional | Domínio completo |
| 80-89% | ⭐ Excelente | Muito bom |
| 70-79% | 🎯 Bom | Bom desempenho |
| 60-69% | 📈 Regular | Precisa melhorar |
| 0-59% | 💪 Precisa Melhorar | Estude mais |

### O que afeta a porcentagem?

Apenas os cards marcados como **"Difícil" (quality 1-2)** contam como erro.
Cards marcados como **"Médio" (quality 3)** e **"Fácil" (quality 5)** contam como acerto.

---

## 🔍 Troubleshooting

### "Minha porcentagem sempre dá 90%"

**Possíveis causas**:
1. Você está marcando 9 cards como Médio/Fácil e 1 como Difícil
2. Pode haver um bug no cálculo

**Para verificar**:
- Abra o console do navegador (F12)
- Veja os logs que aparecem ao finalizar a sessão
- Confira quantos foram marcados como "correct" vs "incorrect"

### "Cards difíceis não aparecem na revisão"

**Solução**:
- Use o modo "Revisão de Difíceis"
- Ele filtra apenas cards com quality <= 2 das sessões anteriores

---

## 🚀 Preparação para 600 Alunos

### ✅ Checklist Pré-Lançamento

- [x] Sistema de auto-avaliação funcionando (Difícil/Médio/Fácil)
- [x] Cálculo de porcentagem correto
- [x] Salvamento de sessões no banco
- [x] Página de resultado com estatísticas
- [x] Página de histórico funcionando
- [x] Algoritmo de repetição espaçada implementado
- [x] Logs de debug para troubleshooting
- [ ] Testar com volume alto de dados
- [ ] Verificar performance do banco
- [ ] Monitorar erros em produção

### 📊 Métricas para Monitorar

1. Taxa de conclusão de sessões
2. Média de acertos por sessão
3. Distribuição de dificuldade (quantos Difícil vs Médio vs Fácil)
4. Cards com menor taxa de acerto
5. Tempo médio por sessão
