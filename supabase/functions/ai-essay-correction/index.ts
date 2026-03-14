import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  action: 'correct' | 'transcribe'
  essayText?: string
  theme?: string
  correctionTemplate?: Record<string, unknown>
  studentName?: string
  imageUrls?: string[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get active AI provider (using service_role to read api_key)
    const { data: provider, error: providerError } = await supabase
      .from('ai_provider_configs')
      .select('*')
      .eq('is_active', true)
      .single()

    if (providerError || !provider) {
      return new Response(
        JSON.stringify({ error: 'Nenhum provedor de IA ativo configurado. Configure em Admin > Integrações.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body: RequestBody = await req.json()

    if (body.action === 'transcribe') {
      const text = await handleTranscribe(provider, body.imageUrls || [])
      return new Response(
        JSON.stringify({ text }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (body.action === 'correct') {
      const result = await handleCorrection(provider, body)
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida. Use "correct" ou "transcribe".' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ============================================================
// Provider-specific API calls
// ============================================================

async function callProvider(
  provider: Record<string, unknown>,
  systemPrompt: string,
  userPrompt: string,
  imageUrls?: string[]
): Promise<string> {
  const providerType = provider.provider as string
  const apiKey = provider.api_key as string
  const model = provider.model_name as string
  const baseUrl = provider.base_url as string | null

  if (!apiKey) {
    throw new Error(`API key não configurada para o provedor ${providerType}`)
  }

  if (providerType === 'claude') {
    return await callClaude(apiKey, model || 'claude-sonnet-4-5-20250514', systemPrompt, userPrompt, imageUrls)
  }
  if (providerType === 'openai') {
    return await callOpenAI(apiKey, model || 'gpt-4o', baseUrl, systemPrompt, userPrompt, imageUrls)
  }
  if (providerType === 'antigravity') {
    return await callOpenAI(apiKey, model || 'default', baseUrl || 'https://api.antigravity.ai/v1', systemPrompt, userPrompt, imageUrls)
  }
  if (providerType === 'gemini') {
    return await callGemini(apiKey, model || 'gemini-2.5-flash', systemPrompt, userPrompt, imageUrls)
  }
  if (providerType === 'dify') {
    return await callDify(apiKey, baseUrl || 'https://api.dify.ai/v1', systemPrompt, userPrompt)
  }

  throw new Error(`Provedor não suportado: ${providerType}`)
}

async function callClaude(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  imageUrls?: string[]
): Promise<string> {
  const content: Record<string, unknown>[] = []

  if (imageUrls && imageUrls.length > 0) {
    for (const url of imageUrls) {
      content.push({
        type: 'image',
        source: { type: 'url', url },
      })
    }
  }
  content.push({ type: 'text', text: userPrompt })

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude API error (${response.status}): ${err}`)
  }

  const data = await response.json()
  return data.content[0].text
}

async function callOpenAI(
  apiKey: string,
  model: string,
  baseUrl: string | null,
  systemPrompt: string,
  userPrompt: string,
  imageUrls?: string[]
): Promise<string> {
  const messages: Record<string, unknown>[] = [
    { role: 'system', content: systemPrompt },
  ]

  if (imageUrls && imageUrls.length > 0) {
    const userContent: Record<string, unknown>[] = imageUrls.map((url) => ({
      type: 'image_url',
      image_url: { url },
    }))
    userContent.push({ type: 'text', text: userPrompt })
    messages.push({ role: 'user', content: userContent })
  } else {
    messages.push({ role: 'user', content: userPrompt })
  }

  const url = `${baseUrl || 'https://api.openai.com/v1'}/chat/completions`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 8192,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI API error (${response.status}): ${err}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  imageUrls?: string[]
): Promise<string> {
  const parts: Record<string, unknown>[] = []

  if (imageUrls && imageUrls.length > 0) {
    for (const url of imageUrls) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: await fetchImageAsBase64(url),
        },
      })
    }
  }
  parts.push({ text: userPrompt })

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts }],
      generationConfig: {
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Gemini API error (${response.status}): ${err}`)
  }

  const data = await response.json()
  const candidate = data.candidates?.[0]
  if (!candidate?.content?.parts?.[0]?.text) {
    throw new Error('Gemini não retornou resposta válida')
  }
  return candidate.content.parts[0].text
}

async function fetchImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Erro ao baixar imagem: ${response.status}`)
  const buffer = await response.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

async function callDify(
  apiKey: string,
  baseUrl: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const response = await fetch(`${baseUrl}/chat-messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      inputs: {},
      query: `${systemPrompt}\n\n${userPrompt}`,
      response_mode: 'blocking',
      user: 'everest-correction',
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Dify API error (${response.status}): ${err}`)
  }

  const data = await response.json()
  return data.answer
}

// ============================================================
// Action Handlers
// ============================================================

function buildCorrectionSystemPrompt(template: Record<string, unknown>): string {
  return `Você é um corretor de redações especializado no modelo de avaliação ${template.name}.
Sua tarefa é analisar redações de forma rigorosa seguindo EXATAMENTE o modelo de correção fornecido.

## MODELO DE CORREÇÃO

### Nota máxima: ${template.max_grade}
### Valor de cada débito de expressão: ${template.expression_debit_value}

### CRITÉRIOS DE ESTRUTURA (o que se espera de cada parágrafo):
${JSON.stringify(template.structure_criteria, null, 2)}

### CRITÉRIOS DE CONTEÚDO (níveis de débito):
${JSON.stringify(template.content_criteria, null, 2)}

## INSTRUÇÕES DE ANÁLISE

### 1. ERROS DE EXPRESSÃO
Para cada erro encontrado, indique:
- paragraph_number: número do parágrafo (1, 2, 3, 4...)
- sentence_number: número do período dentro do parágrafo (1, 2, 3)
- error_text: o trecho EXATO com erro (copie do texto)
- error_explanation: explicação detalhada do porquê é um erro (cite a regra gramatical)
- suggested_correction: a forma correta
- debit_value: ${template.expression_debit_value} (fixo por erro)

Tipos de erros a identificar: concordância nominal, concordância verbal, regência verbal, regência nominal, crase, pontuação (vírgula, ponto-e-vírgula, dois-pontos), ortografia, estrangeirismos, informalidade, uso inadequado de gerúndio, maiúscula/minúscula, paralelismo sintático, ambiguidade.

Use o formato "P{n}, Per. {m}" para referenciar erros (P = parágrafo, Per = período).

### 2. ANÁLISE DE ESTRUTURA
Para cada parágrafo, verifique:
- Se contém os 3 períodos esperados conforme o modelo
- Se os conectivos são adequados (compare com a lista de conectivos esperados do modelo)
- Escreva uma análise detalhada e construtiva
- Atribua um débito (normalmente 0.000 se a estrutura está correta, ou um valor se há problemas graves)

### 3. ANÁLISE DE CONTEÚDO
Para cada critério (pertinência ao tema, argumentação coerente, informatividade):
- Analise o texto conforme a descrição do critério no modelo
- Selecione o nível de débito adequado dentre os níveis disponíveis
- Escreva uma análise detalhada justificando o nível escolhido
- IMPORTANTE: Se selecionar "Fuga TOTAL" em pertinência, a nota final será 0 automaticamente

### 4. SUGESTÕES DE MELHORIA
Gere sugestões detalhadas, específicas e construtivas para cada categoria:
- expression: dicas para evitar os erros de expressão encontrados, com referências a regras gramaticais
- structure: como melhorar a estrutura dos parágrafos
- content: como enriquecer o conteúdo (exemplos de alusões, citações, dados que poderiam ser usados)

## FORMATO DE RESPOSTA
Responda EXCLUSIVAMENTE com um JSON válido. Sem texto adicional, sem markdown code blocks. APENAS o JSON puro.`
}

function buildCorrectionUserPrompt(
  essayText: string,
  theme: string,
  studentName?: string
): string {
  const header = studentName ? `ALUNO: ${studentName}\n` : ''
  return `${header}TEMA DA REDAÇÃO: ${theme}

TEXTO DA REDAÇÃO:
${essayText}

Analise esta redação e retorne o resultado como JSON com esta estrutura exata:
{
  "expressionErrors": [
    {"paragraph_number": 1, "sentence_number": 1, "error_text": "trecho com erro", "error_explanation": "explicação detalhada", "suggested_correction": "correção", "debit_value": 0.200}
  ],
  "structureAnalysis": [
    {"paragraph_number": 1, "paragraph_type": "introduction", "analysis_text": "análise detalhada do parágrafo", "debit_value": 0.000}
  ],
  "contentAnalysis": [
    {"criterion_type": "pertinence", "criterion_name": "Pertinência ao tema", "analysis_text": "análise detalhada", "debit_level": "Pertinente", "debit_value": 0.000},
    {"criterion_type": "argumentation", "criterion_name": "Argumentação coerente", "analysis_text": "análise detalhada", "debit_level": "Claros", "debit_value": 0.000},
    {"criterion_type": "informativity", "criterion_name": "Informatividade", "analysis_text": "análise detalhada", "debit_level": "Três ou mais", "debit_value": 0.000}
  ],
  "improvementSuggestions": [
    {"category": "expression", "suggestion_text": "sugestão detalhada"},
    {"category": "structure", "suggestion_text": "sugestão detalhada"},
    {"category": "content", "suggestion_text": "sugestão detalhada"}
  ],
  "totalExpressionDebit": 0.000,
  "totalStructureDebit": 0.000,
  "totalContentDebit": 0.000,
  "finalGrade": 10.000
}`
}

async function handleCorrection(
  provider: Record<string, unknown>,
  body: RequestBody
): Promise<Record<string, unknown>> {
  if (!body.essayText || !body.theme || !body.correctionTemplate) {
    throw new Error('Dados obrigatórios: essayText, theme, correctionTemplate')
  }

  const systemPrompt = buildCorrectionSystemPrompt(body.correctionTemplate)
  const userPrompt = buildCorrectionUserPrompt(body.essayText, body.theme, body.studentName)

  const responseText = await callProvider(provider, systemPrompt, userPrompt)

  // Parse JSON from AI response (may be wrapped in markdown code blocks)
  let jsonStr = responseText.trim()

  // Remove markdown code blocks if present
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim()
  }

  // Try to find JSON object
  const jsonObjMatch = jsonStr.match(/\{[\s\S]*\}/)
  if (!jsonObjMatch) {
    throw new Error('A IA não retornou JSON válido. Tente novamente.')
  }

  try {
    return JSON.parse(jsonObjMatch[0])
  } catch {
    throw new Error('Erro ao processar resposta da IA. JSON inválido.')
  }
}

async function handleTranscribe(
  provider: Record<string, unknown>,
  imageUrls: string[]
): Promise<string> {
  if (imageUrls.length === 0) {
    throw new Error('Nenhuma imagem fornecida para transcrição')
  }

  const systemPrompt = `Você é um sistema de OCR especializado em transcrever textos manuscritos em português brasileiro.

INSTRUÇÕES:
1. Transcreva o texto EXATAMENTE como escrito, mantendo parágrafos e quebras de linha
2. NÃO corrija erros de ortografia ou gramática — transcreva fielmente
3. Se não conseguir ler algum trecho, indique com [ilegível]
4. Separe cada parágrafo com uma linha em branco
5. Retorne APENAS o texto transcrito, sem comentários adicionais`

  const userPrompt = 'Transcreva o texto manuscrito desta(s) imagem(ns) de redação. Retorne apenas o texto, sem comentários:'

  return await callProvider(provider, systemPrompt, userPrompt, imageUrls)
}
