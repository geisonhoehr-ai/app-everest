# Everest - Plataforma de Educação

Uma plataforma educacional completa construída com React, TypeScript, Vite e Supabase.

## 🚀 Configuração Rápida

### Pré-requisitos
- Node.js (versão 18 ou superior)
- pnpm (gerenciador de pacotes)

### Instalação

1. **Clone o repositório e instale as dependências:**
```bash
pnpm install
```

2. **Configure as variáveis de ambiente:**
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```env
VITE_SUPABASE_URL=sua_url_do_supabase_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_publica_do_supabase_aqui
```

3. **Execute o projeto:**
```bash
pnpm dev
```

A aplicação estará disponível em `http://localhost:8083`

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 18, TypeScript, Vite
- **UI:** Tailwind CSS, Radix UI, Shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Gerenciamento de Estado:** React Context API
- **Roteamento:** React Router

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
├── contexts/           # Contextos do React (Auth, Theme)
├── hooks/              # Hooks customizados
├── lib/                # Utilitários e configurações
├── pages/              # Páginas da aplicação
├── services/           # Serviços de API
└── main.tsx           # Ponto de entrada da aplicação
```

## 🔧 Scripts Disponíveis

- `pnpm dev` - Inicia o servidor de desenvolvimento
- `pnpm build` - Constrói a aplicação para produção
- `pnpm preview` - Visualiza a build de produção
- `pnpm lint` - Executa o linter
- `pnpm test` - Executa os testes

## 🐛 Solução de Problemas

### Erro de CORS
Se você estiver vendo erros de CORS, certifique-se de que:
1. As variáveis de ambiente do Supabase estão configuradas corretamente
2. O projeto está rodando na porta 8082 (conforme configurado)

### Erro de Perfil
Se você estiver vendo "Erro de Perfil", verifique:
1. Se o usuário existe na tabela `users` do Supabase
2. Se as políticas RLS estão configuradas corretamente
3. Se as tabelas `students` e `teachers` estão populadas

## 📝 Notas de Desenvolvimento

- O projeto foi configurado para usar Next.js 15.5.2
- A porta padrão foi alterada para 8082 para evitar conflitos
- O script Skip.js foi removido para evitar erros de CORS desnecessários
