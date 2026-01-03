-- ============================================
-- SCRIPT PARA IMPORTAR FLASHCARDS DE REDAÇÃO
-- ============================================
-- Data: 2025-10-19
-- Baseado em: Cegalla - Redação Dissertativa para Concursos
-- ============================================

-- IMPORTANTE: Execute este script no Supabase SQL Editor
-- Este script adiciona 100 flashcards de Redação

-- ============================================
-- 1. CRIAR TÓPICO DE REDAÇÃO (se não existir)
-- ============================================

DO $$
DECLARE
  portugues_id uuid;
  admin_user_id uuid;
  redacao_topic_id uuid;
BEGIN
  -- Pegar ID do subject Português
  SELECT id INTO portugues_id FROM subjects WHERE name = 'Português' LIMIT 1;

  -- Pegar user_id admin
  SELECT created_by_user_id INTO admin_user_id FROM subjects WHERE id = portugues_id;

  -- Criar tópico Redação se não existir
  INSERT INTO topics (subject_id, name, description, created_by_user_id)
  VALUES (portugues_id, 'Redação Dissertativa', 'Técnicas de redação dissertativa-argumentativa para concursos', admin_user_id)
  ON CONFLICT DO NOTHING;

  -- Pegar ID do tópico criado
  SELECT id INTO redacao_topic_id FROM topics WHERE name = 'Redação Dissertativa' LIMIT 1;

  -- ============================================
  -- 2. ESTRUTURA DA DISSERTAÇÃO (30 flashcards)
  -- ============================================

  INSERT INTO flashcards (topic_id, question, answer, created_by_user_id) VALUES
  -- Conceitos gerais (10)
  (redacao_topic_id, 'O que é uma dissertação?', 'Texto que defende um ponto de vista com base em argumentos lógicos e coerentes, apresentando tese, desenvolvimento e conclusão.', admin_user_id),
  (redacao_topic_id, 'Qual a diferença entre dissertação expositiva e argumentativa?', 'Expositiva apenas apresenta informações sobre um tema; argumentativa defende um ponto de vista com argumentos convincentes.', admin_user_id),
  (redacao_topic_id, 'Quais são as três partes básicas de uma dissertação?', 'Introdução (apresentação da tese), Desenvolvimento (argumentação) e Conclusão (retomada e fechamento).', admin_user_id),
  (redacao_topic_id, 'O que é tese em uma dissertação?', 'É o ponto de vista defendido pelo autor, a ideia central que será argumentada ao longo do texto.', admin_user_id),
  (redacao_topic_id, 'Qual a diferença entre tema e título?', 'Tema é o assunto geral a ser tratado; título é a forma criativa de nomear o texto (geralmente opcional em concursos).', admin_user_id),
  (redacao_topic_id, 'O que caracteriza um texto dissertativo-argumentativo?', 'Defesa de uma tese com argumentos sólidos, linguagem objetiva, impessoalidade e uso de conectivos lógicos.', admin_user_id),
  (redacao_topic_id, 'Qual a função da introdução?', 'Apresentar o tema, contextualizar o assunto e expor a tese que será defendida no texto.', admin_user_id),
  (redacao_topic_id, 'Quantos parágrafos deve ter uma dissertação?', 'Normalmente 4 parágrafos: 1 de introdução, 2 de desenvolvimento e 1 de conclusão (pode variar conforme o edital).', admin_user_id),
  (redacao_topic_id, 'O que é contextualização na introdução?', 'É a apresentação do tema mostrando sua relevância e situando o leitor no assunto antes de apresentar a tese.', admin_user_id),
  (redacao_topic_id, 'Qual o tamanho ideal de cada parágrafo?', 'De 5 a 8 linhas em média, evitando parágrafos muito curtos (menos de 3 linhas) ou muito longos (mais de 10).', admin_user_id),

  -- Introdução (10)
  (redacao_topic_id, 'Quais são os tipos de introdução?', 'Contextualização, interrogação, citação, dados estatísticos, alusão histórica, declaração inicial e comparação.', admin_user_id),
  (redacao_topic_id, 'O que é introdução por contextualização?', 'Apresentar o tema situando-o no contexto atual, mostrando sua relevância antes de expor a tese.', admin_user_id),
  (redacao_topic_id, 'O que é introdução por interrogação?', 'Iniciar o texto com uma pergunta que será respondida ao longo da dissertação, despertando interesse do leitor.', admin_user_id),
  (redacao_topic_id, 'O que é introdução por citação?', 'Começar com frase de autor consagrado, provérbio ou trecho de lei relacionado ao tema.', admin_user_id),
  (redacao_topic_id, 'O que é introdução por dados estatísticos?', 'Apresentar números, pesquisas ou índices que evidenciem a relevância do tema.', admin_user_id),
  (redacao_topic_id, 'O que é introdução por alusão histórica?', 'Resgatar fato histórico relacionado ao tema para contextualizar o assunto.', admin_user_id),
  (redacao_topic_id, 'Como fazer uma boa declaração inicial?', 'Afirmar algo categórico sobre o tema que será comprovado com argumentos no desenvolvimento.', admin_user_id),
  (redacao_topic_id, 'Pode-se usar perguntas retóricas na introdução?', 'Sim, desde que não sejam respondidas imediatamente e sirvam para instigar reflexão sobre o tema.', admin_user_id),
  (redacao_topic_id, 'Deve-se antecipar argumentos na introdução?', 'Não é necessário, mas pode-se indicar brevemente os aspectos que serão abordados no desenvolvimento.', admin_user_id),
  (redacao_topic_id, 'Qual o erro mais comum na introdução?', 'Ser muito vaga, genérica ou repetir o tema sem apresentar uma tese clara e objetiva.', admin_user_id),

  -- Desenvolvimento (10)
  (redacao_topic_id, 'Qual a função do desenvolvimento?', 'Apresentar argumentos que comprovem a tese defendida na introdução, com exemplos, dados e raciocínio lógico.', admin_user_id),
  (redacao_topic_id, 'Quantos argumentos deve ter o desenvolvimento?', 'Pelo menos 2 argumentos principais, geralmente um em cada parágrafo do desenvolvimento.', admin_user_id),
  (redacao_topic_id, 'O que é tópico frasal?', 'Primeira frase do parágrafo que apresenta a ideia principal que será desenvolvida nele.', admin_user_id),
  (redacao_topic_id, 'Como estruturar um parágrafo de desenvolvimento?', 'Tópico frasal (ideia principal) + argumentação/exemplificação + conclusão parcial com conectivo de transição.', admin_user_id),
  (redacao_topic_id, 'O que são argumentos de autoridade?', 'Citações de especialistas, pesquisadores ou documentos oficiais que validam o ponto de vista defendido.', admin_user_id),
  (redacao_topic_id, 'O que são argumentos por exemplificação?', 'Uso de exemplos concretos da realidade para ilustrar e comprovar a tese defendida.', admin_user_id),
  (redacao_topic_id, 'O que são argumentos de causa e consequência?', 'Mostrar relação de causalidade entre fatos para demonstrar a validade da tese.', admin_user_id),
  (redacao_topic_id, 'O que são argumentos por comparação?', 'Estabelecer paralelo entre situações, épocas ou lugares para evidenciar semelhanças ou diferenças.', admin_user_id),
  (redacao_topic_id, 'Pode-se usar dados estatísticos no desenvolvimento?', 'Sim, dados numéricos, pesquisas e índices fortalecem a argumentação e conferem credibilidade ao texto.', admin_user_id),
  (redacao_topic_id, 'Como evitar argumentos fracos?', 'Basear-se em fatos, não em opiniões pessoais; usar dados concretos; evitar generalidades e senso comum.', admin_user_id),

  -- ============================================
  -- 3. COESÃO E COERÊNCIA (30 flashcards)
  -- ============================================

  -- Coesão (15)
  (redacao_topic_id, 'O que é coesão textual?', 'Conexão harmoniosa entre as partes do texto por meio de elementos linguísticos (conectivos, pronomes, sinônimos).', admin_user_id),
  (redacao_topic_id, 'Quais são os principais conectivos de adição?', 'Além disso, ademais, outrossim, também, ainda, não só... mas também, tanto... quanto.', admin_user_id),
  (redacao_topic_id, 'Quais são os principais conectivos de oposição?', 'Porém, contudo, todavia, entretanto, no entanto, não obstante, apesar de, embora.', admin_user_id),
  (redacao_topic_id, 'Quais são os principais conectivos de conclusão?', 'Portanto, logo, assim, por isso, por conseguinte, dessa forma, em vista disso.', admin_user_id),
  (redacao_topic_id, 'Quais são os principais conectivos de causa?', 'Porque, pois, uma vez que, visto que, já que, dado que, em virtude de.', admin_user_id),
  (redacao_topic_id, 'Quais são os principais conectivos de consequência?', 'De modo que, de forma que, de sorte que, tanto que, tão... que.', admin_user_id),
  (redacao_topic_id, 'Quais são os principais conectivos de tempo?', 'Quando, enquanto, logo que, assim que, depois que, desde que, antes que.', admin_user_id),
  (redacao_topic_id, 'Quais são os principais conectivos de finalidade?', 'Para que, a fim de que, com o propósito de, com o objetivo de, com vistas a.', admin_user_id),
  (redacao_topic_id, 'O que é anáfora?', 'Retomada de termo anteriormente mencionado por meio de pronomes, sinônimos ou expressões equivalentes.', admin_user_id),
  (redacao_topic_id, 'O que é catáfora?', 'Antecipação de termo que será mencionado posteriormente no texto.', admin_user_id),
  (redacao_topic_id, 'Como evitar repetição de palavras?', 'Usar sinônimos, pronomes, hipônimos, hiperônimos ou elipse (omissão de termos já mencionados).', admin_user_id),
  (redacao_topic_id, 'O que é elipse na coesão textual?', 'Omissão de termo já mencionado que pode ser facilmente identificado pelo contexto.', admin_user_id),
  (redacao_topic_id, 'Pode-se começar parágrafo com conectivo?', 'Sim, conectivos no início do parágrafo estabelecem relação lógica com o parágrafo anterior.', admin_user_id),
  (redacao_topic_id, 'Qual erro comum de coesão?', 'Uso excessivo de "que", falta de conectivos entre frases ou uso inadequado de pronomes sem referente claro.', admin_user_id),
  (redacao_topic_id, 'Como usar "este/esse" corretamente?', '"Este" refere-se ao mais próximo ou ao que será mencionado; "esse" refere-se ao mais distante ou já mencionado.', admin_user_id),

  -- Coerência (15)
  (redacao_topic_id, 'O que é coerência textual?', 'Relação lógica entre as ideias do texto, garantindo sentido global e progressão temática sem contradições.', admin_user_id),
  (redacao_topic_id, 'Qual a diferença entre coesão e coerência?', 'Coesão é a conexão linguística entre partes do texto; coerência é a lógica e sentido das ideias apresentadas.', admin_user_id),
  (redacao_topic_id, 'O que é progressão textual?', 'Desenvolvimento gradual das ideias sem repetições desnecessárias, agregando informações novas a cada parágrafo.', admin_user_id),
  (redacao_topic_id, 'O que é não-contradição?', 'Princípio de coerência que exige ausência de ideias contraditórias ao longo do texto.', admin_user_id),
  (redacao_topic_id, 'O que é relevância em coerência?', 'Todas as informações do texto devem ser pertinentes ao tema, sem desvios ou divagações.', admin_user_id),
  (redacao_topic_id, 'Como garantir coerência argumentativa?', 'Manter relação lógica entre tese e argumentos, evitar contradições e apresentar conclusão compatível com o defendido.', admin_user_id),
  (redacao_topic_id, 'O que são argumentos incoerentes?', 'Argumentos que não sustentam a tese ou apresentam contradições lógicas.', admin_user_id),
  (redacao_topic_id, 'Pode-se mudar de opinião no texto?', 'Não. A dissertação deve manter posicionamento consistente do início ao fim.', admin_user_id),
  (redacao_topic_id, 'Como evitar incoerência temporal?', 'Manter consistência no uso de tempos verbais, evitando saltos injustificados entre passado, presente e futuro.', admin_user_id),
  (redacao_topic_id, 'O que é quebra de coerência?', 'Ruptura lógica, contradição de ideias, fuga do tema ou argumentos incompatíveis com a tese.', admin_user_id),
  (redacao_topic_id, 'Como manter unidade temática?', 'Todos os parágrafos devem relacionar-se ao tema central e contribuir para defender a tese.', admin_user_id),
  (redacao_topic_id, 'O que é redundância?', 'Repetição desnecessária de ideias que não acrescenta informação nova ao texto.', admin_user_id),
  (redacao_topic_id, 'Como evitar circularidade?', 'Não repetir mesma ideia em diferentes palavras; cada parágrafo deve agregar novos argumentos.', admin_user_id),
  (redacao_topic_id, 'O que é informatividade?', 'Capacidade do texto de trazer informações novas, relevantes e adequadas ao grau de conhecimento do leitor.', admin_user_id),
  (redacao_topic_id, 'Como checar coerência do texto?', 'Reler verificando se cada parágrafo contribui para tese, se não há contradições e se conclusão retoma argumentos.', admin_user_id),

  -- ============================================
  -- 4. CONCLUSÃO (20 flashcards)
  -- ============================================

  (redacao_topic_id, 'Qual a função da conclusão?', 'Retomar a tese, sintetizar argumentos principais e apresentar fechamento coerente com o desenvolvimento.', admin_user_id),
  (redacao_topic_id, 'Quais são os tipos de conclusão?', 'Síntese, proposta de intervenção, retomada da tese, analogia, citação e projeção futura.', admin_user_id),
  (redacao_topic_id, 'O que é conclusão por síntese?', 'Resumir os principais argumentos apresentados e reafirmar a tese defendida.', admin_user_id),
  (redacao_topic_id, 'O que é conclusão por proposta de intervenção?', 'Apresentar soluções práticas para o problema discutido (comum no ENEM e concursos).', admin_user_id),
  (redacao_topic_id, 'Como fazer proposta de intervenção?', 'Indicar agentes (quem), ações (o quê), meios (como), finalidade (para quê) e detalhamento.', admin_user_id),
  (redacao_topic_id, 'Pode-se apresentar ideia nova na conclusão?', 'Não. A conclusão deve apenas retomar e sintetizar o que já foi desenvolvido.', admin_user_id),
  (redacao_topic_id, 'Quais conectivos usar na conclusão?', 'Portanto, logo, assim, dessa forma, em suma, em síntese, por tudo isso, diante do exposto.', admin_user_id),
  (redacao_topic_id, 'Como evitar conclusão genérica?', 'Retomar especificamente os argumentos desenvolvidos, não usar clichês e manter coerência com a tese.', admin_user_id),
  (redacao_topic_id, 'O que é conclusão por analogia?', 'Estabelecer comparação final que reforce a tese defendida no texto.', admin_user_id),
  (redacao_topic_id, 'Pode-se usar citação na conclusão?', 'Sim, desde que reforce a tese e não seja longa demais.', admin_user_id),
  (redacao_topic_id, 'O que é conclusão por projeção futura?', 'Apresentar possíveis cenários futuros caso a tese seja ou não aplicada.', admin_user_id),
  (redacao_topic_id, 'Qual o tamanho ideal da conclusão?', 'De 5 a 7 linhas, proporcional ao desenvolvimento (não deve ser muito extensa).', admin_user_id),
  (redacao_topic_id, 'Pode-se fazer pergunta na conclusão?', 'Evite. A conclusão deve apresentar fechamento, não deixar dúvidas ou questões em aberto.', admin_user_id),
  (redacao_topic_id, 'Como retomar a tese na conclusão?', 'Reafirmar o ponto de vista inicial usando palavras diferentes, sintetizando a argumentação desenvolvida.', admin_user_id),
  (redacao_topic_id, 'Quais erros evitar na conclusão?', 'Introduzir argumento novo, contradizer a tese, ser vaga/genérica, usar clichês ("Portanto, conclui-se que...").', admin_user_id),
  (redacao_topic_id, 'O que caracteriza uma boa conclusão?', 'Retomada clara da tese, síntese dos argumentos, coerência com desenvolvimento e fechamento definitivo.', admin_user_id),
  (redacao_topic_id, 'Deve-se propor solução sempre?', 'Depende do edital. Em alguns concursos é obrigatório; em outros, opcional. Verifique a banca.', admin_user_id),
  (redacao_topic_id, 'Como evitar conclusão abrupta?', 'Usar conectivos conclusivos e fazer transição suave do último parágrafo do desenvolvimento para a conclusão.', admin_user_id),
  (redacao_topic_id, 'Pode-se expressar opinião pessoal na conclusão?', 'A conclusão deve reafirmar a tese (que já é uma opinião), mas manter impessoalidade na linguagem.', admin_user_id),
  (redacao_topic_id, 'O que é "amarração" textual?', 'Garantir que introdução, desenvolvimento e conclusão formem unidade coesa, sem rupturas lógicas.', admin_user_id),

  -- ============================================
  -- 5. TÉCNICAS DE ARGUMENTAÇÃO (20 flashcards)
  -- ============================================

  (redacao_topic_id, 'O que é argumentação?', 'Processo de sustentar uma tese por meio de raciocínios lógicos, provas e exemplos convincentes.', admin_user_id),
  (redacao_topic_id, 'Quais os tipos de argumento?', 'Autoridade, exemplificação, causa-consequência, comparação, dados estatísticos, raciocínio lógico.', admin_user_id),
  (redacao_topic_id, 'Como usar argumento de autoridade?', 'Citar especialistas, estudos, leis ou documentos oficiais que validem seu ponto de vista.', admin_user_id),
  (redacao_topic_id, 'O que é argumento de exemplificação?', 'Apresentar casos concretos, fatos históricos ou situações reais que ilustrem e comprovem a tese.', admin_user_id),
  (redacao_topic_id, 'O que é argumento de causa-consequência?', 'Demonstrar relação de causalidade entre fenômenos para justificar a tese defendida.', admin_user_id),
  (redacao_topic_id, 'O que é argumento por comparação?', 'Estabelecer paralelo entre situações para evidenciar semelhanças ou diferenças relevantes.', admin_user_id),
  (redacao_topic_id, 'Como usar dados estatísticos?', 'Apresentar números de fontes confiáveis que comprovem a relevância do tema ou fortaleçam a argumentação.', admin_user_id),
  (redacao_topic_id, 'O que é raciocínio lógico dedutivo?', 'Partir de premissa geral para conclusão particular (todos os A são B; X é A; logo X é B).', admin_user_id),
  (redacao_topic_id, 'O que é raciocínio lógico indutivo?', 'Partir de casos particulares para conclusão geral (observação de padrão em vários casos).', admin_user_id),
  (redacao_topic_id, 'Como evitar argumento de senso comum?', 'Basear-se em dados, pesquisas e raciocínio lógico, não em opiniões sem fundamento.', admin_user_id),
  (redacao_topic_id, 'O que são falácias argumentativas?', 'Erros de raciocínio que invalidam o argumento (generalização, apelo à emoção, falsa causalidade).', admin_user_id),
  (redacao_topic_id, 'O que é generalização indevida?', 'Estender conclusão de caso particular para todos os casos sem evidências suficientes.', admin_user_id),
  (redacao_topic_id, 'O que é apelo à emoção?', 'Tentar convencer por sentimentos em vez de lógica e fatos (deve ser evitado).', admin_user_id),
  (redacao_topic_id, 'O que é falsa causalidade?', 'Atribuir relação de causa-efeito entre eventos que apenas coincidem temporalmente.', admin_user_id),
  (redacao_topic_id, 'Como fortalecer argumentação?', 'Usar mais de um tipo de argumento, articular dados com raciocínio lógico, contextualizar exemplos.', admin_user_id),
  (redacao_topic_id, 'Pode-se refutar contra-argumentos?', 'Sim, apresentar e refutar visão contrária fortalece a tese (argumento de concessão e refutação).', admin_user_id),
  (redacao_topic_id, 'O que é argumento de concessão?', 'Reconhecer ponto de vista oposto antes de refutá-lo ou mostrar que não invalida a tese.', admin_user_id),
  (redacao_topic_id, 'Como iniciar argumento de concessão?', 'Usar conectivos como "embora", "apesar de", "ainda que" seguidos de refutação com "porém", "contudo".', admin_user_id),
  (redacao_topic_id, 'Quantas linhas deve ter cada argumento?', 'De 3 a 5 linhas de explicação/exemplificação após apresentar a ideia principal (tópico frasal).', admin_user_id),
  (redacao_topic_id, 'Como encadear argumentos?', 'Usar conectivos adequados entre parágrafos e frases, garantindo progressão lógica das ideias.', admin_user_id)

  ON CONFLICT DO NOTHING;

END $$;

-- ============================================
-- VERIFICAR RESULTADO
-- ============================================

SELECT
  t.name as topico,
  COUNT(f.id) as total_flashcards
FROM topics t
LEFT JOIN flashcards f ON f.topic_id = t.id
WHERE t.name = 'Redação Dissertativa'
GROUP BY t.name;

-- ============================================
-- FIM DO SCRIPT - PARTE 1
-- ============================================
-- Total de flashcards inseridos: 100
-- Tópico: Redação Dissertativa
-- Baseado em: Paschoal Cegalla e técnicas para concursos
-- ============================================
