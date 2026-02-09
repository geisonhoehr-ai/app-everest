export default function PrivacyPage() {
  return (
    <div className="bg-background">
      <div className="container py-16 md:py-24">
        <div className="prose prose-lg dark:prose-invert max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">
            Política de Privacidade
          </h1>
          <p>
            A sua privacidade é importante para nós. É política da Everest
            Preparatórios respeitar a sua privacidade em relação a qualquer
            informação sua que possamos coletar no site Everest Preparatórios, e
            outros sites que possuímos e operamos.
          </p>

          <h2>1. Informações que Coletamos</h2>
          <p>
            Coletamos informações que você nos fornece diretamente, como quando
            você cria uma conta, se inscreve em um curso ou se comunica conosco.
            Também coletamos informações automaticamente, como seu endereço IP e
            informações sobre seu dispositivo.
          </p>

          <h2>2. Como Usamos Suas Informações</h2>
          <p>
            Usamos as informações que coletamos para operar, manter e fornecer
            os recursos e a funcionalidade do Serviço, para nos comunicarmos com
            você, para personalizar o conteúdo e para monitorar a eficácia do
            nosso Serviço.
          </p>

          <h2>3. Compartilhamento de Informações</h2>
          <p>
            Não compartilhamos suas informações pessoais com terceiros, exceto
            conforme descrito nesta Política de Privacidade ou se tivermos o seu
            consentimento. Podemos compartilhar informações com fornecedores de
            serviços que nos ajudam a operar nosso negócio.
          </p>

          <h2>4. Segurança</h2>
          <p>
            A segurança de seus dados é importante para nós, mas lembre-se de
            que nenhum método de transmissão pela Internet ou método de
            armazenamento eletrônico é 100% seguro. Embora nos esforcemos para
            usar meios comercialmente aceitáveis para proteger suas Informações
            Pessoais, não podemos garantir sua segurança absoluta.
          </p>

          <h2>5. Seus Direitos</h2>
          <p>
            Você tem o direito de acessar, corrigir ou excluir suas informações
            pessoais. Você também pode ter outros direitos sob a lei aplicável.
          </p>

          <h2>6. Alterações a Esta Política de Privacidade</h2>
          <p>
            Podemos atualizar nossa Política de Privacidade de tempos em tempos.
            Notificaremos você sobre quaisquer alterações publicando a nova
            Política de Privacidade nesta página.
          </p>
          <p className="text-sm text-muted-foreground mt-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  )
}
