export default function TermsPage() {
  return (
    <div className="bg-background">
      <div className="container py-16 md:py-24">
        <div className="prose prose-lg dark:prose-invert max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">
            Termos de Serviço
          </h1>
          <p>
            Bem-vindo à Everest Preparatórios! Estes Termos de Serviço
            ("Termos") regem o seu uso da nossa plataforma de cursos online. Ao
            acessar ou usar nossos serviços, você concorda em cumprir estes
            Termos.
          </p>

          <h2>1. Contas</h2>
          <p>
            Ao criar uma conta conosco, você deve nos fornecer informações
            precisas, completas e atuais. A falha em fazer isso constitui uma
            violação dos Termos, que pode resultar na rescisão imediata da sua
            conta em nosso Serviço.
          </p>

          <h2>2. Assinaturas</h2>
          <p>
            Algumas partes do Serviço são cobradas com base em uma assinatura
            ("Assinatura(s)"). Você será cobrado antecipadamente de forma
            recorrente e periódica ("Ciclo de Faturamento"). Os ciclos de
            faturamento são definidos mensalmente ou anualmente, dependendo do
            tipo de plano de assinatura que você selecionar ao comprar uma
            Assinatura.
          </p>

          <h2>3. Conteúdo</h2>
          <p>
            Nosso Serviço permite que você publique, vincule, armazene,
            compartilhe e disponibilize certas informações, textos, gráficos,
            vídeos ou outros materiais ("Conteúdo"). Você é responsável pelo
            Conteúdo que publica no Serviço, incluindo sua legalidade,
            confiabilidade e adequação.
          </p>

          <h2>4. Propriedade Intelectual</h2>
          <p>
            O Serviço e seu conteúdo original, recursos e funcionalidades são e
            permanecerão propriedade exclusiva da Everest Preparatórios e de
            seus licenciadores.
          </p>

          <h2>5. Alterações</h2>
          <p>
            Reservamo-nos o direito, a nosso exclusivo critério, de modificar ou
            substituir estes Termos a qualquer momento. Se uma revisão for
            material, tentaremos fornecer um aviso com pelo menos 30 dias de
            antecedência antes que quaisquer novos termos entrem em vigor.
          </p>

          <h2>6. Contate-Nos</h2>
          <p>
            Se você tiver alguma dúvida sobre estes Termos, entre em contato
            conosco através da nossa página de contato.
          </p>
          <p className="text-sm text-muted-foreground mt-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  )
}
