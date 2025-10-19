-- ============================================
-- SCRIPT PARA IMPORTAR FLASHCARDS DE INTERPRETAÇÃO DE TEXTO
-- ============================================
-- Data: 2025-10-19
-- Baseado em: Cegalla - Interpretação e Compreensão de Textos
-- ============================================

-- IMPORTANTE: Execute este script no Supabase SQL Editor
-- Este script adiciona 100 flashcards de Interpretação de Texto

-- ============================================
-- 1. CRIAR TÓPICO DE INTERPRETAÇÃO (se não existir)
-- ============================================

DO $$
DECLARE
  portugues_id uuid;
  admin_user_id uuid;
  interpretacao_topic_id uuid;
BEGIN
  -- Pegar ID do subject Português
  SELECT id INTO portugues_id FROM subjects WHERE name = 'Português' LIMIT 1;

  -- Pegar user_id admin
  SELECT created_by_user_id INTO admin_user_id FROM subjects WHERE id = portugues_id;

  -- Criar tópico Interpretação se não existir
  INSERT INTO topics (subject_id, name, description, created_by_user_id)
  VALUES (portugues_id, 'Interpretação de Texto', 'Técnicas de interpretação e compreensão textual para concursos', admin_user_id)
  ON CONFLICT DO NOTHING;

  -- Pegar ID do tópico criado
  SELECT id INTO interpretacao_topic_id FROM topics WHERE name = 'Interpretação de Texto' LIMIT 1;

  -- ============================================
  -- 2. CONCEITOS FUNDAMENTAIS (20 flashcards)
  -- ============================================

  INSERT INTO flashcards (topic_id, question, answer, created_by_user_id) VALUES
  (interpretacao_topic_id, 'Qual a diferença entre tema e assunto?', 'Tema é a ideia central abstrata do texto; assunto é sobre o que o texto fala concretamente.', admin_user_id),
  (interpretacao_topic_id, 'O que é ideia principal?', 'É a mensagem central que o autor quer transmitir, normalmente ligada ao tema do texto.', admin_user_id),
  (interpretacao_topic_id, 'O que são ideias secundárias?', 'São informações complementares que desenvolvem, exemplificam ou explicam a ideia principal.', admin_user_id),
  (interpretacao_topic_id, 'O que é inferência textual?', 'É a conclusão que se chega a partir de informações implícitas no texto, usando raciocínio lógico.', admin_user_id),
  (interpretacao_topic_id, 'Qual a diferença entre informação explícita e implícita?', 'Explícita está claramente expressa no texto; implícita está subentendida e requer interpretação.', admin_user_id),
  (interpretacao_topic_id, 'O que é pressuposição?', 'É uma informação não expressa diretamente, mas que está implícita e é considerada verdadeira.', admin_user_id),
  (interpretacao_topic_id, 'O que é subentendido?', 'É uma informação implícita que pode ou não ser verdadeira, sugerida intencionalmente pelo autor.', admin_user_id),
  (interpretacao_topic_id, 'O que é contexto textual?', 'São as condições em que o texto foi produzido: quem escreve, para quem, quando, onde e por quê.', admin_user_id),
  (interpretacao_topic_id, 'O que é polissemia?', 'É a propriedade de uma palavra ter múltiplos significados, sendo o sentido definido pelo contexto.', admin_user_id),
  (interpretacao_topic_id, 'O que é ambiguidade?', 'É a ocorrência de duplo sentido em palavra, frase ou texto, geralmente não intencional.', admin_user_id),
  (interpretacao_topic_id, 'Qual a diferença entre denotação e conotação?', 'Denotação é o sentido literal, objetivo; conotação é o sentido figurado, subjetivo.', admin_user_id),
  (interpretacao_topic_id, 'O que é vocabulário contextual?', 'É o significado que uma palavra assume especificamente dentro do contexto em que aparece.', admin_user_id),
  (interpretacao_topic_id, 'O que é paráfrase?', 'É a reescrita de um texto mantendo o sentido original, mas com palavras diferentes.', admin_user_id),
  (interpretacao_topic_id, 'O que é síntese?', 'É a condensação das ideias principais de um texto de forma concisa e objetiva.', admin_user_id),
  (interpretacao_topic_id, 'O que é resumo?', 'É a apresentação reduzida do texto original, mantendo as ideias essenciais com palavras próprias.', admin_user_id),
  (interpretacao_topic_id, 'O que é intertextualidade?', 'É a relação entre textos, quando um texto faz referência, cita ou dialoga com outro.', admin_user_id),
  (interpretacao_topic_id, 'O que é progressão temática?', 'É o desenvolvimento gradual do tema ao longo do texto, acrescentando informações novas.', admin_user_id),
  (interpretacao_topic_id, 'O que é tópico frasal na leitura?', 'É a frase que contém a ideia principal de um parágrafo, geralmente no início.', admin_user_id),
  (interpretacao_topic_id, 'Como identificar o objetivo do autor?', 'Analisando o tipo de texto, o tom, os argumentos usados e a conclusão apresentada.', admin_user_id),
  (interpretacao_topic_id, 'O que é leitura crítica?', 'É a análise reflexiva que vai além da compreensão literal, questionando intenções e avaliando argumentos.', admin_user_id),

  -- ============================================
  -- 3. TIPOLOGIA TEXTUAL (20 flashcards)
  -- ============================================

  (interpretacao_topic_id, 'O que é texto narrativo?', 'Texto que conta uma história com personagens, tempo, espaço, enredo (apresentação, desenvolvimento, clímax, desfecho).', admin_user_id),
  (interpretacao_topic_id, 'Quais os elementos da narrativa?', 'Narrador, personagens, tempo, espaço, enredo (fatos) e foco narrativo.', admin_user_id),
  (interpretacao_topic_id, 'O que é foco narrativo?', 'É a perspectiva de quem conta a história: 1ª pessoa (narrador-personagem) ou 3ª pessoa (narrador-observador).', admin_user_id),
  (interpretacao_topic_id, 'O que é texto descritivo?', 'Texto que retrata características de seres, objetos, ambientes ou processos, com uso de adjetivos.', admin_user_id),
  (interpretacao_topic_id, 'Qual a diferença entre descrição objetiva e subjetiva?', 'Objetiva apresenta fatos concretos sem opinião; subjetiva inclui impressões e sentimentos do autor.', admin_user_id),
  (interpretacao_topic_id, 'O que é texto dissertativo-expositivo?', 'Texto que explica, informa ou expõe ideias sobre um tema sem necessariamente defender opinião.', admin_user_id),
  (interpretacao_topic_id, 'O que é texto dissertativo-argumentativo?', 'Texto que defende um ponto de vista sobre um tema com argumentos, visando convencer o leitor.', admin_user_id),
  (interpretacao_topic_id, 'O que é texto injuntivo/instrucional?', 'Texto que dá ordens, instruções ou conselhos, usando verbos no imperativo (receitas, manuais).', admin_user_id),
  (interpretacao_topic_id, 'O que é texto dialogal?', 'Texto construído por meio de diálogo entre interlocutores (entrevistas, conversas, peças teatrais).', admin_user_id),
  (interpretacao_topic_id, 'Como identificar o tipo textual?', 'Observando estrutura, objetivo comunicativo, tempos verbais predominantes e características linguísticas.', admin_user_id),
  (interpretacao_topic_id, 'Qual tempo verbal predomina em narrativas?', 'Pretérito perfeito e imperfeito (verbos de ação no passado).', admin_user_id),
  (interpretacao_topic_id, 'Qual tempo verbal predomina em descrições?', 'Presente ou pretérito imperfeito (verbos de estado).', admin_user_id),
  (interpretacao_topic_id, 'Qual tempo verbal predomina em dissertações?', 'Presente do indicativo (apresentação de ideias atemporais).', admin_user_id),
  (interpretacao_topic_id, 'Qual tempo verbal predomina em injunções?', 'Imperativo (dar ordens/instruções) ou infinitivo.', admin_user_id),
  (interpretacao_topic_id, 'Pode haver mistura de tipos textuais?', 'Sim, um texto pode ter trechos descritivos dentro de narrativa, ou argumentativos em exposição.', admin_user_id),
  (interpretacao_topic_id, 'O que caracteriza texto narrativo literário?', 'Linguagem conotativa, figuras de linguagem, foco na estética, personagens complexos.', admin_user_id),
  (interpretacao_topic_id, 'O que caracteriza texto narrativo não-literário?', 'Linguagem denotativa, objetividade, finalidade informativa (notícias, relatos).', admin_user_id),
  (interpretacao_topic_id, 'Como identificar sequência narrativa?', 'Presença de ações em ordem cronológica ou temporal, com personagens e acontecimentos.', admin_user_id),
  (interpretacao_topic_id, 'Como identificar sequência descritiva?', 'Enumeração de características, uso abundante de adjetivos, verbos de ligação.', admin_user_id),
  (interpretacao_topic_id, 'Como identificar sequência argumentativa?', 'Presença de tese, argumentos, conectivos lógicos e conclusão.', admin_user_id),

  -- ============================================
  -- 4. GÊNEROS TEXTUAIS (20 flashcards)
  -- ============================================

  (interpretacao_topic_id, 'O que é gênero textual?', 'São formas de textos que circulam socialmente, com função comunicativa específica (carta, notícia, artigo).', admin_user_id),
  (interpretacao_topic_id, 'Qual a diferença entre tipo e gênero textual?', 'Tipo é a estrutura (narrar, descrever); gênero é a forma social do texto (conto, reportagem).', admin_user_id),
  (interpretacao_topic_id, 'O que é notícia?', 'Gênero jornalístico que relata fato atual de interesse público, com linguagem objetiva e clara.', admin_user_id),
  (interpretacao_topic_id, 'O que é reportagem?', 'Gênero jornalístico que aprofunda um tema com análise, entrevistas e contexto, mais extensa que notícia.', admin_user_id),
  (interpretacao_topic_id, 'O que é artigo de opinião?', 'Gênero que defende ponto de vista sobre tema atual, assinado, com argumentação e linguagem mais pessoal.', admin_user_id),
  (interpretacao_topic_id, 'O que é editorial?', 'Texto que expressa a opinião oficial do veículo de comunicação sobre tema relevante, sem assinatura.', admin_user_id),
  (interpretacao_topic_id, 'O que é crônica?', 'Gênero literário-jornalístico que comenta fatos cotidianos de forma subjetiva, criativa e muitas vezes humorística.', admin_user_id),
  (interpretacao_topic_id, 'O que é conto?', 'Narrativa curta, fictícia, com poucos personagens, tempo e espaço limitados, unidade de ação.', admin_user_id),
  (interpretacao_topic_id, 'O que é resenha crítica?', 'Gênero que apresenta resumo e avaliação crítica de obra (livro, filme), com opinião fundamentada.', admin_user_id),
  (interpretacao_topic_id, 'O que é carta argumentativa?', 'Carta que defende ponto de vista sobre problema, destinada a autoridade ou jornal, com tom formal.', admin_user_id),
  (interpretacao_topic_id, 'O que é entrevista?', 'Gênero dialogal com perguntas e respostas entre entrevistador e entrevistado sobre tema específico.', admin_user_id),
  (interpretacao_topic_id, 'O que é charge?', 'Gênero multimodal (imagem + texto) com crítica humorística de fato atual, usando ironia e caricatura.', admin_user_id),
  (interpretacao_topic_id, 'O que é tirinha?', 'Narrativa curta em quadrinhos com personagens fixos, geralmente com humor ou crítica social.', admin_user_id),
  (interpretacao_topic_id, 'O que é infográfico?', 'Gênero que combina texto e elementos visuais (gráficos, ilustrações) para informar de forma clara.', admin_user_id),
  (interpretacao_topic_id, 'O que é resumo acadêmico?', 'Texto que condensa ideias principais de obra científica, com linguagem objetiva e impessoal.', admin_user_id),
  (interpretacao_topic_id, 'O que é relatório?', 'Gênero que apresenta informações sobre atividades, pesquisas ou eventos de forma organizada e objetiva.', admin_user_id),
  (interpretacao_topic_id, 'O que é carta do leitor?', 'Texto enviado por leitor a veículo de comunicação, comentando matéria publicada ou opinando sobre tema.', admin_user_id),
  (interpretacao_topic_id, 'Como identificar o público-alvo?', 'Observando linguagem (formal/informal), vocabulário, assunto e veículo de circulação do texto.', admin_user_id),
  (interpretacao_topic_id, 'O que é função social do gênero?', 'É o objetivo comunicativo que o gênero cumpre na sociedade (informar, entreter, convencer).', admin_user_id),
  (interpretacao_topic_id, 'Como identificar o gênero de um texto?', 'Analisando estrutura, finalidade, suporte (onde circula), linguagem e contexto de produção.', admin_user_id),

  -- ============================================
  -- 5. TÉCNICAS DE INTERPRETAÇÃO (20 flashcards)
  -- ============================================

  (interpretacao_topic_id, 'O que é leitura superficial (skimming)?', 'Leitura rápida para captar ideia geral do texto, passando os olhos por títulos e primeiras frases.', admin_user_id),
  (interpretacao_topic_id, 'O que é leitura seletiva (scanning)?', 'Leitura focada em buscar informação específica no texto, sem ler todo conteúdo.', admin_user_id),
  (interpretacao_topic_id, 'O que é leitura analítica?', 'Leitura detalhada e reflexiva para compreender profundamente estrutura, argumentos e intenções do texto.', admin_user_id),
  (interpretacao_topic_id, 'Como identificar palavras-chave?', 'São termos que concentram as ideias principais, geralmente substantivos e verbos importantes repetidos.', admin_user_id),
  (interpretacao_topic_id, 'Como usar o contexto para entender vocabulário?', 'Observar palavras ao redor, estrutura da frase e sentido geral do parágrafo para deduzir significado.', admin_user_id),
  (interpretacao_topic_id, 'O que são pistas contextuais?', 'São informações no texto que ajudam a compreender termos desconhecidos (sinônimos, exemplos, explicações).', admin_user_id),
  (interpretacao_topic_id, 'Como identificar causa e consequência?', 'Procurar conectivos (porque, pois, logo, portanto) e relações lógicas entre ideias.', admin_user_id),
  (interpretacao_topic_id, 'Como identificar comparação no texto?', 'Observar conectivos (como, assim como, tal qual) e estabelecimento de semelhanças/diferenças.', admin_user_id),
  (interpretacao_topic_id, 'Como identificar opinião vs fato?', 'Fatos podem ser comprovados; opiniões expressam julgamento pessoal (verbos de opinião, adjetivos avaliativos).', admin_user_id),
  (interpretacao_topic_id, 'O que é argumento de autoridade na leitura?', 'Citação de especialista, pesquisa ou fonte confiável para validar informação apresentada.', admin_user_id),
  (interpretacao_topic_id, 'Como identificar ironia?', 'Observar contradição entre o que é dito e o contexto, uso de aspas, exageros ou tom sarcástico.', admin_user_id),
  (interpretacao_topic_id, 'Como identificar humor no texto?', 'Observar jogos de palavras, situações inusitadas, exageros, quebra de expectativa.', admin_user_id),
  (interpretacao_topic_id, 'O que é paródia na interpretação?', 'É a imitação cômica de outro texto, mantendo estrutura mas mudando conteúdo para criticar ou satirizar.', admin_user_id),
  (interpretacao_topic_id, 'Como identificar crítica social?', 'Observar denúncia de problemas, tom questionador, ironia, contraste entre ideal e real.', admin_user_id),
  (interpretacao_topic_id, 'Como identificar o tom do texto?', 'Analisando escolha vocabular, adjetivos, pontuação (formal, irônico, emotivo, crítico, informativo).', admin_user_id),
  (interpretacao_topic_id, 'O que é leitura nas entrelinhas?', 'É perceber informações implícitas, intenções não declaradas e sentidos sugeridos pelo autor.', admin_user_id),
  (interpretacao_topic_id, 'Como identificar progressão temporal?', 'Observar advérbios de tempo, tempos verbais e sequência lógica dos acontecimentos.', admin_user_id),
  (interpretacao_topic_id, 'Como relacionar título ao texto?', 'O título geralmente sintetiza tema, ideia principal ou desperta curiosidade; deve ser coerente com conteúdo.', admin_user_id),
  (interpretacao_topic_id, 'Qual a função dos exemplos no texto?', 'Ilustrar, concretizar ideias abstratas, tornar argumentos mais convincentes e facilitar compreensão.', admin_user_id),
  (interpretacao_topic_id, 'Como evitar interpretação equivocada?', 'Ler atentamente todo texto, não tirar frases do contexto, buscar comprovação no próprio texto.', admin_user_id),

  -- ============================================
  -- 6. FIGURAS DE LINGUAGEM EM CONTEXTO (20 flashcards)
  -- ============================================

  (interpretacao_topic_id, 'O que é metáfora?', 'Comparação implícita entre termos sem uso de conectivo (Ex: "Meu coração é um balde despejado").', admin_user_id),
  (interpretacao_topic_id, 'O que é comparação?', 'Aproximação explícita entre termos usando conectivo (como, tal qual, assim como).', admin_user_id),
  (interpretacao_topic_id, 'O que é metonímia?', 'Substituição de termo por outro com relação de proximidade (causa/efeito, autor/obra, continente/conteúdo).', admin_user_id),
  (interpretacao_topic_id, 'O que é personificação/prosopopeia?', 'Atribuição de características humanas a seres inanimados ou irracionais.', admin_user_id),
  (interpretacao_topic_id, 'O que é hipérbole?', 'Exagero intencional para dar ênfase à ideia (Ex: "Já disse isso um milhão de vezes").', admin_user_id),
  (interpretacao_topic_id, 'O que é eufemismo?', 'Suavização de ideia desagradável ou tabu (Ex: "Ele nos deixou" = morreu).', admin_user_id),
  (interpretacao_topic_id, 'O que é antítese?', 'Aproximação de ideias ou palavras de sentidos opostos (Ex: "amor e ódio").', admin_user_id),
  (interpretacao_topic_id, 'O que é paradoxo?', 'Ideias contraditórias que coexistem criando novo sentido (Ex: "É proibido proibir").', admin_user_id),
  (interpretacao_topic_id, 'O que é ironia?', 'Dizer o contrário do que se pensa, geralmente com intenção crítica ou humorística.', admin_user_id),
  (interpretacao_topic_id, 'O que é aliteração?', 'Repetição de sons consonantais para criar efeito sonoro (Ex: "O rato roeu a roupa").', admin_user_id),
  (interpretacao_topic_id, 'O que é assonância?', 'Repetição de sons vocálicos para criar musicalidade no texto.', admin_user_id),
  (interpretacao_topic_id, 'O que é onomatopeia?', 'Reprodução de som por meio de palavra (Ex: "tic-tac", "miau", "crash").', admin_user_id),
  (interpretacao_topic_id, 'O que é pleonasmo?', 'Redundância que reforça ideia, pode ser vício (subir para cima) ou figura de estilo intencional.', admin_user_id),
  (interpretacao_topic_id, 'O que é catacrese?', 'Metáfora desgastada pelo uso que se tornou comum (Ex: "pé da mesa", "asa da xícara").', admin_user_id),
  (interpretacao_topic_id, 'O que é sinestesia?', 'Mistura de sensações de sentidos diferentes (Ex: "voz aveludada", "doce melodia").', admin_user_id),
  (interpretacao_topic_id, 'O que é gradação?', 'Sequência de ideias em ordem crescente ou decrescente de intensidade.', admin_user_id),
  (interpretacao_topic_id, 'O que é anacoluto?', 'Quebra de construção sintática, deixando termo sem função na frase (comum na fala).', admin_user_id),
  (interpretacao_topic_id, 'O que é elipse na estilística?', 'Omissão de termo facilmente subentendido, tornando texto mais conciso.', admin_user_id),
  (interpretacao_topic_id, 'Como identificar figura de linguagem?', 'Observar linguagem conotativa, comparações, exageros, sentidos não-literais e efeitos estilísticos.', admin_user_id),
  (interpretacao_topic_id, 'Qual a função das figuras no texto?', 'Tornar linguagem mais expressiva, criar imagens, gerar emoção e enriquecer sentidos do texto.', admin_user_id)

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
WHERE t.name = 'Interpretação de Texto'
GROUP BY t.name;

-- ============================================
-- FIM DO SCRIPT - PARTE 2
-- ============================================
-- Total de flashcards inseridos: 100
-- Tópico: Interpretação de Texto
-- Baseado em: Paschoal Cegalla e técnicas para concursos
-- ============================================
