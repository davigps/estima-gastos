# Estima Odontologia — Controle de Gastos

Dashboard mobile-first para controle financeiro de consultório odontológico. Registre receitas e despesas, visualize relatórios com benchmarks do setor e acompanhe a saúde financeira do consultório.

## Funcionalidades

- **Dashboard** — resumo mensal com receitas, despesas, saldo e gráfico dos últimos 6 meses
- **Despesas** — cadastro com categoria, tipo (fixo/variável), fornecedor e recorrência
- **Receitas** — cadastro com especialidade, forma de pagamento e paciente
- **Categorias** — gerenciamento de categorias com ativação/desativação
- **Relatórios** — DRE simplificado, gráficos de pizza/barras/linha e indicadores vs benchmark do setor
- **Autenticação** — acesso por senha fixa via variável de ambiente
- **Mobile-first** — navegação bottom-tab no celular, sidebar no desktop

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript (strict) |
| Estilização | Tailwind CSS v4 |
| Banco de dados | PostgreSQL |
| ORM | Prisma v7 |
| Autenticação | Senha fixa + JWT (jose) |
| Gráficos | Recharts |
| Formulários | React Hook Form + Zod |
| Package Manager | pnpm |

---

## Como rodar

### 1. Pré-requisitos

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Um banco PostgreSQL (local, [Neon](https://neon.tech) ou [Supabase](https://supabase.com))

### 2. Instalar dependências

```bash
pnpm install
```

### 3. Configurar variáveis de ambiente

Copie o arquivo de exemplo e preencha com seus valores:

```bash
cp .env.example .env.local
```

Edite `.env.local`:

```env
# String de conexão PostgreSQL
DATABASE_URL="postgresql://usuario:senha@host:5432/estima_odontologia"

# Senha para acessar o sistema
AUTH_PASSWORD="sua-senha-aqui"

# Chave secreta para assinar tokens JWT (mínimo 32 caracteres)
JWT_SECRET="uma-chave-secreta-longa-e-aleatoria-aqui"
```

> **Supabase:** a connection string fica em *Project Settings → Database → Connection string → URI*
> **Neon:** disponível no painel do projeto em *Connection Details*

### 4. Criar o banco de dados

Rode a migration para criar as tabelas:

```bash
npx prisma migrate dev --name init
```

### 5. Popular categorias padrão

Execute o seed para criar as categorias de despesa e receita pré-configuradas:

```bash
pnpm db:seed
```

### 6. Iniciar o servidor

```bash
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000) e entre com a senha definida em `AUTH_PASSWORD`.

---

## Scripts disponíveis

| Script | Descrição |
|---|---|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Build de produção |
| `pnpm start` | Inicia o servidor em produção |
| `pnpm db:migrate` | Cria e aplica novas migrations |
| `pnpm db:seed` | Popula categorias padrão |
| `pnpm db:studio` | Abre o Prisma Studio (interface visual do banco) |

---

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | ✅ | Connection string PostgreSQL |
| `AUTH_PASSWORD` | ✅ | Senha de acesso ao sistema |
| `JWT_SECRET` | ✅ | Chave para assinar tokens JWT (mín. 32 chars) |

---

## Estrutura do projeto

```
app/
├── (auth)/login/          # Tela de login
├── (dashboard)/           # Páginas autenticadas
│   ├── page.tsx           # Dashboard
│   ├── despesas/          # Lista e cadastro de despesas
│   ├── receitas/          # Lista e cadastro de receitas
│   ├── categorias/        # Gerenciamento de categorias
│   └── relatorios/        # Relatórios e gráficos
├── api/                   # API Routes
│   ├── auth/              # Login e logout
│   ├── dashboard/         # Dados agregados do dashboard
│   ├── despesas/          # CRUD despesas
│   ├── receitas/          # CRUD receitas
│   ├── categorias/        # CRUD categorias
│   └── relatorios/        # Dados para relatórios
components/
├── ui/                    # Button, Input, Card, Modal, Select, Badge...
├── layout/                # Sidebar, MobileNav, Header
├── dashboard/             # ResumoCards, GraficoMensal, TopCategorias
└── forms/                 # DespesaForm, ReceitaForm
lib/
├── auth.ts                # JWT sign/verify
├── prisma.ts              # Prisma Client singleton
├── validators.ts          # Schemas Zod
└── utils.ts               # formatCurrency, formatDate, cn
prisma/
├── schema.prisma          # Modelos do banco
└── seed.ts                # Categorias padrão
proxy.ts                   # Proteção de rotas autenticadas
```

---

## Deploy (Vercel)

1. Suba o código para um repositório GitHub
2. Importe o projeto na [Vercel](https://vercel.com)
3. Configure as variáveis de ambiente no painel da Vercel
4. Faça o deploy — a Vercel detecta automaticamente o Next.js

> Lembre-se de rodar `npx prisma migrate deploy` no ambiente de produção antes do primeiro acesso.
