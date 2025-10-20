# Everest - Plataforma de Educação

Uma plataforma educacional completa e moderna construída com React, TypeScript, Vite e Supabase, focada em preparação para concursos e vestibulares.

## 🎯 Sobre o Projeto

O Everest é uma plataforma educacional abrangente que oferece:

- **Flashcards Interativos** - Sistema de estudo com cartões de memorização
- **Quizzes e Simulados** - Avaliações e testes práticos
- **Sistema de Redações** - Correção e análise de textos
- **Cursos Online** - Conteúdo estruturado com aulas e materiais
- **Gamificação** - Sistema de conquistas e ranking
- **Estudo em Grupo** - Sessões colaborativas de estudo
- **PWA** - Aplicativo web progressivo para uso offline
- **Painel Administrativo** - Gestão completa de usuários e conteúdo

## 🚀 Como Executar

### Pré-requisitos
- Node.js (versão 18 ou superior)
- pnpm (gerenciador de pacotes recomendado)
- Conta no Supabase

### Instalação

1. **Clone o repositório:**
```bash
git clone <url-do-repositorio>
cd app.everest
```

2. **Instale as dependências:**
```bash
pnpm install
```

3. **Configure as variáveis de ambiente:**
Crie um arquivo `.env` na raiz do projeto:
```env
VITE_SUPABASE_URL=sua_url_do_supabase_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_publica_do_supabase_aqui
```

4. **Execute o projeto:**
```bash
pnpm dev
```

A aplicação estará disponível em `http://localhost:8082`

### Scripts Disponíveis

- `pnpm dev` - Inicia o servidor de desenvolvimento
- `pnpm build` - Constrói a aplicação para produção
- `pnpm preview` - Visualiza a build de produção
- `pnpm lint` - Executa o linter (oxlint)
- `pnpm lint:fix` - Corrige automaticamente problemas de lint
- `pnpm format` - Formata o código com Prettier
- `pnpm test` - Executa os testes
- `pnpm test:watch` - Executa os testes em modo watch

## 🧪 Como Testar

### Executar Testes

```bash
# Executar todos os testes
pnpm test

# Executar testes em modo watch
pnpm test:watch
```

### Estrutura de Testes

Os testes estão localizados na pasta `tests/` e utilizam:
- **Vitest** - Framework de testes
- **Testing Library** - Utilitários para testes de componentes React
- **Happy DOM** - Ambiente de DOM para testes

### Exemplo de Teste

```typescript
import { test, expect } from 'vitest'
import { render } from '@testing-library/react'
import App from '../src/App'

test('A aplicação renderiza corretamente', () => {
  const { container } = render(<App />)
  expect(container.childNodes).not.toHaveLength(0)
})
```

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 19** - Biblioteca de interface
- **TypeScript** - Linguagem tipada
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS
- **Radix UI** - Componentes acessíveis
- **Shadcn/ui** - Sistema de design

### Backend & Serviços
- **Supabase** - Backend como serviço
  - PostgreSQL - Banco de dados
  - Auth - Autenticação
  - Storage - Armazenamento de arquivos
  - Real-time - Atualizações em tempo real

### Funcionalidades
- **PWA** - Aplicativo web progressivo
- **Offline Support** - Funcionamento offline
- **Responsive Design** - Design responsivo
- **Dark/Light Theme** - Temas claro e escuro

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── admin/          # Componentes administrativos
│   ├── dashboard/      # Componentes do dashboard
│   ├── flashcards/     # Componentes de flashcards
│   ├── quizzes/        # Componentes de quizzes
│   └── ui/             # Componentes de interface
├── contexts/           # Contextos do React (Auth, Theme)
├── hooks/              # Hooks customizados
├── lib/                # Utilitários e configurações
├── pages/              # Páginas da aplicação
├── services/           # Serviços de API
└── main.tsx           # Ponto de entrada da aplicação
```

## 🔧 Configuração do Supabase

### Migrações
As migrações do banco de dados estão na pasta `supabase/migrations/`. Para aplicar:

```bash
# Aplicar migrações
supabase db push

# Resetar banco (cuidado!)
supabase db reset
```

### Políticas RLS
O projeto utiliza Row Level Security (RLS) do Supabase para controle de acesso. Certifique-se de que as políticas estão configuradas corretamente.

## 🐛 Solução de Problemas

### Erro de CORS
Se você estiver vendo erros de CORS:
1. Verifique se as variáveis de ambiente do Supabase estão configuradas
2. Confirme se o projeto está rodando na porta 8082

### Erro de Autenticação
Se houver problemas de login:
1. Verifique se o usuário existe na tabela `users`
2. Confirme se as políticas RLS estão configuradas
3. Verifique se as tabelas `students` e `teachers` estão populadas

### Problemas de Build
```bash
# Limpar cache e reinstalar
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

## 📱 PWA (Progressive Web App)

O Everest é um PWA completo com:
- Instalação no dispositivo
- Funcionamento offline
- Notificações push
- Atualizações automáticas

## 🎨 Temas

A aplicação suporta temas claro e escuro com transição suave entre eles.

## 📊 Funcionalidades Administrativas

- Gestão de usuários e permissões
- Criação e edição de cursos
- Administração de flashcards e quizzes
- Relatórios e analytics
- Sistema de gamificação

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte e dúvidas, entre em contato através dos canais oficiais da plataforma.
