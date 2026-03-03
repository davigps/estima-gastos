# Plano de Implementação — Estima Odontologia

Dashboard mobile-first para controle de gastos de consultório odontológico.

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript (strict) |
| Estilização | Tailwind CSS v4 |
| Banco de dados | PostgreSQL (via Neon ou Supabase) |
| ORM | Prisma |
| Autenticação | Senha fixa via variável de ambiente (`AUTH_PASSWORD`) |
| Sessão | Cookie HTTP-only com JWT (jose) |
| Gráficos | Recharts |
| Formulários | React Hook Form + Zod |
| Package Manager | pnpm |

---

## Estrutura de Diretórios (alvo final)

```
app/
├── (auth)/
│   └── login/
│       └── page.tsx              # Tela de login (senha fixa)
├── (dashboard)/
│   ├── layout.tsx                # Layout autenticado (sidebar/navbar mobile)
│   ├── page.tsx                  # Dashboard principal (resumo)
│   ├── despesas/
│   │   ├── page.tsx              # Lista de despesas
│   │   └── nova/page.tsx         # Cadastrar despesa
│   ├── receitas/
│   │   ├── page.tsx              # Lista de receitas
│   │   └── nova/page.tsx         # Cadastrar receita
│   ├── categorias/
│   │   └── page.tsx              # Gerenciar categorias
│   └── relatorios/
│       └── page.tsx              # Relatórios e gráficos
├── api/
│   ├── auth/
│   │   ├── login/route.ts        # POST — validar senha, criar sessão
│   │   └── logout/route.ts       # POST — destruir sessão
│   ├── despesas/route.ts         # CRUD despesas
│   ├── receitas/route.ts         # CRUD receitas
│   └── categorias/route.ts       # CRUD categorias
├── layout.tsx
├── globals.css
└── middleware.ts                  # Proteger rotas autenticadas
lib/
├── auth.ts                       # Funções de JWT (sign/verify)
├── prisma.ts                     # Cliente Prisma singleton
├── validators.ts                 # Schemas Zod
└── utils.ts                      # Helpers (formatação de moeda, datas)
components/
├── ui/                           # Componentes base (Button, Input, Card, Modal)
├── layout/
│   ├── MobileNav.tsx             # Navegação bottom-tab mobile
│   ├── Sidebar.tsx               # Sidebar para desktop
│   └── Header.tsx                # Header com logo e logout
├── dashboard/
│   ├── ResumoCards.tsx           # Cards de resumo (receita, despesa, saldo)
│   ├── GraficoMensal.tsx        # Gráfico receita vs despesa
│   └── TopCategorias.tsx        # Top categorias de gasto
├── forms/
│   ├── DespesaForm.tsx          # Formulário de despesa
│   └── ReceitaForm.tsx          # Formulário de receita
└── tables/
    ├── DespesasTable.tsx        # Tabela/lista de despesas
    └── ReceitasTable.tsx        # Tabela/lista de receitas
prisma/
├── schema.prisma                # Schema do banco
└── seed.ts                      # Seed com categorias padrão
```

---

## Modelo de Dados (Prisma Schema)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Categoria {
  id        String     @id @default(cuid())
  nome      String
  tipo      TipoLancamento
  icone     String?
  cor       String?
  ativa     Boolean    @default(true)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  despesas  Despesa[]
  receitas  Receita[]
}

model Despesa {
  id           String     @id @default(cuid())
  descricao    String
  valor        Decimal    @db.Decimal(10, 2)
  data         DateTime
  categoriaId  String
  categoria    Categoria  @relation(fields: [categoriaId], references: [id])
  tipoGasto    TipoGasto  @default(VARIAVEL)
  fornecedor   String?
  observacao   String?
  recorrente   Boolean    @default(false)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}

model Receita {
  id              String          @id @default(cuid())
  descricao       String
  valor           Decimal         @db.Decimal(10, 2)
  data            DateTime
  categoriaId     String
  categoria       Categoria       @relation(fields: [categoriaId], references: [id])
  formaPagamento  FormaPagamento
  paciente        String?
  observacao      String?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
}

enum TipoLancamento {
  DESPESA
  RECEITA
}

enum TipoGasto {
  FIXO
  VARIAVEL
}

enum FormaPagamento {
  DINHEIRO
  PIX
  CARTAO_CREDITO
  CARTAO_DEBITO
  TRANSFERENCIA
  BOLETO
  CONVENIO
}
```

---

## Categorias Padrão (Seed)

### Categorias de Despesa

| Categoria | Ícone | Benchmark (% receita) |
|---|---|---|
| Pessoal (salários, encargos) | 👤 | 24-28% |
| Materiais Clínicos (resinas, anestésicos, EPI) | 🏥 | ~6% |
| Laboratório / Prótese | 🦷 | ~5% |
| Aluguel e Infraestrutura | 🏢 | 5-10% |
| Equipamentos (manutenção e aquisição) | ⚙️ | CapEx |
| Administrativo (escritório, software, contabilidade) | 📋 | até 10% |
| Marketing | 📣 | variável |
| Impostos e Taxas | 💰 | regime-dependente |
| Seguros | 🛡️ | variável |
| Educação Continuada | 📚 | variável |
| Utilidades (água, luz, internet, telefone) | ⚡ | incluído em infraestrutura |
| Descarte de Resíduos | ♻️ | variável |

### Categorias de Receita

| Categoria | Descrição |
|---|---|
| Clínica Geral | Restaurações, extrações, profilaxia |
| Ortodontia | Aparelhos, manutenção mensal |
| Implantodontia | Implantes e próteses sobre implante |
| Prótese Dentária | Próteses fixas, removíveis, totais |
| Endodontia | Tratamento de canal |
| Periodontia | Tratamentos gengivais |
| Cirurgia | Extrações complexas, sisos |
| Estética / Harmonização | Clareamento, facetas, botox |
| Odontopediatria | Atendimento infantil |
| Radiologia | Exames radiográficos |
| Outros | Venda de produtos |

---

## Passos de Implementação

### Fase 1 — Setup e Infraestrutura

**Passo 1.1 — Instalar dependências**
```bash
pnpm add prisma @prisma/client jose zod react-hook-form @hookform/resolvers recharts
pnpm add -D @types/node
```

**Passo 1.2 — Configurar variáveis de ambiente**

Criar `.env.local`:
```env
DATABASE_URL="postgresql://user:password@host:5432/estima_odontologia"
AUTH_PASSWORD="senha-segura-aqui"
JWT_SECRET="chave-secreta-jwt-32-caracteres-minimo"
```

Criar `.env.example` (sem valores sensíveis, commitado no repo):
```env
DATABASE_URL="postgresql://user:password@host:5432/estima_odontologia"
AUTH_PASSWORD=""
JWT_SECRET=""
```

**Passo 1.3 — Configurar Prisma**
- Inicializar: `npx prisma init`
- Criar o schema conforme modelo de dados acima
- Rodar migration: `npx prisma migrate dev --name init`
- Criar seed com categorias padrão
- Configurar singleton do Prisma Client em `lib/prisma.ts`

**Passo 1.4 — Configurar Next.js**
- Alterar `lang="en"` para `lang="pt-BR"` no layout raiz
- Atualizar metadata (title, description)
- Limpar boilerplate da page.tsx

---

### Fase 2 — Autenticação

**Passo 2.1 — Implementar lib/auth.ts**
- Função `signToken(payload)` — gera JWT com `jose` (expiração: 7 dias)
- Função `verifyToken(token)` — verifica e decodifica JWT
- Usa `JWT_SECRET` do `.env`

**Passo 2.2 — API Route de login (`app/api/auth/login/route.ts`)**
- Recebe `{ password }` no body
- Compara com `AUTH_PASSWORD` do `.env`
- Se correto: gera JWT, seta cookie `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`
- Se incorreto: retorna 401

**Passo 2.3 — API Route de logout (`app/api/auth/logout/route.ts`)**
- Remove o cookie de sessão

**Passo 2.4 — Middleware (`app/middleware.ts`)**
- Intercepta todas as rotas exceto `/login`, `/api/auth/*`, `/_next/*`, e arquivos estáticos
- Verifica presença e validade do cookie JWT
- Se inválido: redireciona para `/login`

**Passo 2.5 — Tela de login (`app/(auth)/login/page.tsx`)**
- Design mobile-first: logo "Estima Odontologia" + campo de senha + botão entrar
- Feedback visual de erro (senha incorreta)
- Redirect para dashboard se já autenticado

---

### Fase 3 — Layout e Navegação (Mobile-First)

**Passo 3.1 — Layout autenticado (`app/(dashboard)/layout.tsx`)**
- Sidebar colapsável para desktop (>768px)
- Bottom navigation bar para mobile (<768px)
- Header com logo e botão de logout

**Passo 3.2 — Componente MobileNav**
- Barra fixa na parte inferior
- Ícones + labels para: Dashboard, Despesas, Receitas, Relatórios
- Indicador visual da página ativa

**Passo 3.3 — Componente Sidebar**
- Links de navegação com ícones
- Visível apenas em telas >= md (768px)
- Seções: Dashboard, Despesas, Receitas, Categorias, Relatórios

**Passo 3.4 — Componentes UI base**
- Button (variantes: primary, secondary, danger, ghost)
- Input (com label e estado de erro)
- Card (container com sombra)
- Modal (para confirmações e formulários rápidos)
- Select, Badge, EmptyState

---

### Fase 4 — Dashboard Principal

**Passo 4.1 — Cards de resumo (`components/dashboard/ResumoCards.tsx`)**
- Receita total do mês
- Despesa total do mês
- Saldo (receita - despesa)
- Comparação com mês anterior (% variação)
- Cores: verde para receita, vermelho para despesa, azul para saldo

**Passo 4.2 — Gráfico mensal (`components/dashboard/GraficoMensal.tsx`)**
- Gráfico de barras (Recharts): receita vs despesa por mês (últimos 6 meses)
- Responsivo com `ResponsiveContainer`

**Passo 4.3 — Top categorias de gasto (`components/dashboard/TopCategorias.tsx`)**
- Lista das 5 maiores categorias de despesa do mês
- Barra de progresso visual com porcentagem
- Comparação com benchmark quando disponível

**Passo 4.4 — API para dados do dashboard**
- `GET /api/dashboard` — retorna resumo agregado (receitas, despesas, saldo, comparações)
- Queries otimizadas com agregações do Prisma

---

### Fase 5 — CRUD de Despesas

**Passo 5.1 — API de despesas (`app/api/despesas/route.ts`)**
- `GET` — listar com filtros (data início/fim, categoria, tipo gasto), paginação, ordenação
- `POST` — criar despesa (validação com Zod)
- `PUT /api/despesas/[id]` — atualizar
- `DELETE /api/despesas/[id]` — excluir

**Passo 5.2 — Lista de despesas (`app/(dashboard)/despesas/page.tsx`)**
- Layout de lista/cards para mobile (não tabela)
- Filtros: mês/ano, categoria, tipo (fixo/variável)
- Cada item mostra: descrição, valor, categoria (badge colorido), data
- Botão de ação: editar, excluir (com confirmação)
- Botão flutuante "+" para nova despesa (mobile)
- Total no rodapé

**Passo 5.3 — Formulário de despesa (`components/forms/DespesaForm.tsx`)**
- Campos: descrição, valor (input monetário R$), data, categoria (select), tipo gasto (fixo/variável), fornecedor (opcional), observação (opcional), recorrente (toggle)
- Validação com Zod + React Hook Form
- Teclado numérico automático no campo de valor (inputMode="decimal")

---

### Fase 6 — CRUD de Receitas

**Passo 6.1 — API de receitas (`app/api/receitas/route.ts`)**
- Mesmo padrão do CRUD de despesas
- Filtros adicionais: forma de pagamento

**Passo 6.2 — Lista de receitas (`app/(dashboard)/receitas/page.tsx`)**
- Mesmo layout mobile-friendly da lista de despesas
- Filtros: mês/ano, categoria (especialidade), forma de pagamento
- Badge com forma de pagamento

**Passo 6.3 — Formulário de receita (`components/forms/ReceitaForm.tsx`)**
- Campos: descrição, valor, data, categoria (especialidade), forma de pagamento (select), paciente (opcional), observação (opcional)

---

### Fase 7 — Gerenciamento de Categorias

**Passo 7.1 — API de categorias (`app/api/categorias/route.ts`)**
- `GET` — listar todas (filtro por tipo: despesa/receita)
- `POST` — criar categoria customizada
- `PUT` — editar
- `DELETE` — soft delete (desativar, não remover)

**Passo 7.2 — Tela de categorias (`app/(dashboard)/categorias/page.tsx`)**
- Abas: Despesas | Receitas
- Lista com nome, ícone, cor
- Ações: editar, desativar/reativar
- As categorias padrão (seed) podem ser editadas mas não excluídas

---

### Fase 8 — Relatórios

**Passo 8.1 — API de relatórios (`app/api/relatorios/route.ts`)**
- Endpoint que aceita parâmetros: período, agrupamento (mês, categoria, forma pagamento)
- Retorna dados agregados formatados para gráficos

**Passo 8.2 — Tela de relatórios (`app/(dashboard)/relatorios/page.tsx`)**
- Seletor de período (mês/trimestre/ano/customizado)
- Gráfico de pizza: distribuição de despesas por categoria
- Gráfico de barras: receita vs despesa mensal
- Gráfico de linha: evolução do saldo ao longo do tempo
- Tabela resumo tipo DRE simplificado:
  - (+) Total Receitas
  - (-) Total Despesas Fixas
  - (-) Total Despesas Variáveis
  - (=) Resultado Operacional
- Indicadores com benchmark:
  - "Materiais clínicos: 8% da receita (benchmark: 6%)" com cor de alerta

---

### Fase 9 — Polimento e UX

**Passo 9.1 — Tema e identidade visual**
- Paleta de cores profissional (azul/verde para saúde)
- Logo/marca "Estima Odontologia" no header
- Modo escuro (dark mode) opcional

**Passo 9.2 — Feedback e loading states**
- Skeleton loading em todas as telas
- Toast notifications para sucesso/erro em operações
- Confirmação antes de excluir registros
- Estados vazios com ilustração e CTA

**Passo 9.3 — PWA básico**
- Manifest.json para "instalar" no celular
- Meta tags para status bar e ícone
- Viewport e touch optimizations

**Passo 9.4 — Formatação e localização**
- Valores em R$ (BRL) com `Intl.NumberFormat`
- Datas em formato brasileiro (dd/mm/aaaa)
- Input de valor com máscara monetária

---

## Benchmarks de Referência para o Consultório

O app deve exibir alertas visuais quando os gastos ultrapassarem os benchmarks:

| Categoria | % Saudável da Receita |
|---|---|
| Overhead total | 59-65% |
| Pessoal | 24-28% |
| Materiais clínicos | ~6% |
| Laboratório/Prótese | ~5% |
| Infraestrutura | 5-10% |
| Administrativo | até 10% |

---

## Variáveis de Ambiente Necessárias

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL |
| `AUTH_PASSWORD` | Senha fixa para login |
| `JWT_SECRET` | Chave secreta para assinar tokens JWT |

---

## Ordem de Execução Resumida

1. Setup (deps, Prisma, env, banco) — **Fase 1**
2. Autenticação (login, middleware, JWT) — **Fase 2**
3. Layout e navegação mobile-first — **Fase 3**
4. Dashboard com resumo e gráficos — **Fase 4**
5. CRUD de despesas — **Fase 5**
6. CRUD de receitas — **Fase 6**
7. Gerenciamento de categorias — **Fase 7**
8. Relatórios e gráficos avançados — **Fase 8**
9. Polimento, PWA e UX — **Fase 9**
