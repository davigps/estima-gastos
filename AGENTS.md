# AGENTS.md — Guia para Desenvolvimento com Agentes de IA

Este arquivo descreve as convenções, padrões e armadilhas do projeto **Estima Odontologia** para que agentes de IA possam desenvolver com consistência.

---

## Comandos essenciais

```bash
pnpm dev              # Servidor de desenvolvimento (porta 3000)
pnpm build            # Build de produção — SEMPRE rodar antes de finalizar uma tarefa
npx tsc --noEmit      # Verificação de tipos sem build
npx prisma generate   # Regenerar o Prisma Client após alterar schema.prisma
pnpm db:migrate       # Criar e aplicar nova migration (requer DATABASE_URL configurado)
pnpm db:seed          # Popular categorias padrão
pnpm db:studio        # Interface visual do banco (Prisma Studio)
```

**Fluxo mínimo ao terminar qualquer mudança:**
1. `npx tsc --noEmit` — zero erros de tipo
2. `pnpm build` — zero erros de build

---

## Arquitetura e estrutura

```
app/
├── (auth)/login/page.tsx          # Tela de login — sem layout autenticado
├── (dashboard)/                   # Grupo de rotas autenticadas
│   ├── layout.tsx                 # Layout com Sidebar + MobileNav + Header
│   ├── page.tsx                   # Dashboard principal "/"
│   ├── despesas/page.tsx
│   ├── receitas/page.tsx
│   ├── categorias/page.tsx
│   └── relatorios/page.tsx
├── api/                           # API Routes (Server-side apenas)
│   ├── auth/login/route.ts
│   ├── auth/logout/route.ts
│   ├── dashboard/route.ts
│   ├── despesas/route.ts + [id]/route.ts
│   ├── receitas/route.ts + [id]/route.ts
│   ├── categorias/route.ts + [id]/route.ts
│   └── relatorios/route.ts
└── layout.tsx                     # Root layout — só aplica fonte e globals.css

components/
├── ui/          Button, Input, Card, Modal, Select, Badge, EmptyState, Skeleton
├── layout/      Sidebar, MobileNav, Header
├── dashboard/   ResumoCards, GraficoMensal, TopCategorias
└── forms/       DespesaForm, ReceitaForm

lib/
├── auth.ts        signToken(payload) / verifyToken(token) — usa jose
├── prisma.ts      Singleton do PrismaClient com adapter pg
├── validators.ts  Schemas Zod — despesaSchema, receitaSchema, categoriaSchema
└── utils.ts       formatCurrency, formatDate, formatMonth, toInputDate, cn

prisma/
├── schema.prisma  Modelos: Categoria, Despesa, Receita + enums
├── seed.ts        Seed de categorias padrão
└── migrations/    Gerado pelo Prisma — não editar manualmente

proxy.ts           Proteção de rotas — substitui middleware.ts no Next.js 16
prisma.config.ts   Config do Prisma v7 — datasource URL fica aqui, NÃO no schema
```

---

## Gotchas críticos — leia antes de escrever código

### Prisma v7 — mudanças breaking
- **NÃO** coloque `url = env("DATABASE_URL")` no `datasource db {}` do `schema.prisma`. A URL fica em `prisma.config.ts`.
- O `PrismaClient` precisa do adapter `@prisma/adapter-pg`. Veja `lib/prisma.ts` para o padrão correto.
- Após qualquer alteração no `schema.prisma`, rode `npx prisma generate`.
- Para migrations em produção, use `npx prisma migrate deploy` (não `dev`).
- Scripts Node fora do Next.js (ex: seed) precisam de `import "dotenv/config"` no topo para carregar o `.env`, e também do adapter pg — veja `prisma/seed.ts` como referência.

### Next.js 16 — proxy em vez de middleware
- O arquivo de proteção de rotas é `proxy.ts` na raiz (não `middleware.ts`).
- A função exportada se chama `proxy`, não `middleware`.
- A config `matcher` continua igual.

### Zod v4 + react-hook-form
- O `zodResolver` do `@hookform/resolvers` tem incompatibilidade de tipos com Zod v4.
- Padrão adotado para contornar — declare o resolver fora do componente:
  ```ts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolver = zodResolver(minhaSchema) as any;
  ```
- E no `handleSubmit`, use cast explícito:
  ```ts
  handleSubmit(onSubmit as SubmitHandler<MeuTipo>)
  ```
- Nunca passe `zodResolver(schema)` diretamente no `useForm` — vai quebrar os tipos.

### Recharts — tipo do formatter no Tooltip
- O `formatter` do `<Tooltip>` recebe `value: number | undefined`.
- Use sempre: `formatter={(v) => formatCurrency(Number(v))}` — nunca `(v: number) => ...`.

### Campos nullable vs undefined no TypeScript
- O Prisma retorna campos opcionais como `string | null`.
- React Hook Form e Zod esperam `string | undefined`.
- Ao popular `defaultValues` de um formulário a partir de um registro do banco, converta:
  ```ts
  fornecedor: registro.fornecedor ?? undefined,
  paciente:   registro.paciente   ?? undefined,
  ```

### Route groups e conflito de rotas
- `app/(dashboard)/page.tsx` resolve para `/`.
- **Não crie** `app/page.tsx` — vai conflitar com o de cima e quebrar o build.

---

## Padrões de código

### API Routes (Server-side)
```ts
// app/api/recurso/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { minhaSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  // ... lógica
  return NextResponse.json({ dados });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = minhaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  // ... criar no banco
  return NextResponse.json(resultado, { status: 201 });
}
```

### Rotas dinâmicas — params são Promise no Next.js 15+
```ts
// app/api/recurso/[id]/route.ts
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // DEVE ser awaited
  // ...
}
```

### Páginas client-side (padrão das páginas do dashboard)
```ts
"use client";

import { useEffect, useState } from "react";
// ... imports de componentes e tipos

export default function MinhaPage() {
  const [data, setData] = useState<MeuTipo[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/meu-endpoint");
    const json = await res.json();
    setData(json.itens);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  if (loading) return <ListSkeleton />;
  if (data.length === 0) return <EmptyState ... />;
  return ( /* lista dos itens */ );
}
```

### Formulários com react-hook-form + zod
```ts
"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { meuSchema, MeuInput } from "@/lib/validators";

// Fora do componente — obrigatório para evitar erro de tipos com Zod v4
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const resolver = zodResolver(meuSchema) as any;

export default function MeuForm({ onSubmit }: { onSubmit: (d: MeuInput) => Promise<void> }) {
  const { register, handleSubmit, formState: { errors } } = useForm<MeuInput>({ resolver });

  return (
    <form onSubmit={handleSubmit(onSubmit as SubmitHandler<MeuInput>)}>
      <Input label="Campo" error={errors.campo?.message} {...register("campo")} />
      <Button type="submit">Salvar</Button>
    </form>
  );
}
```

### Novos schemas Zod
Adicione em `lib/validators.ts`. Exporte sempre o tipo inferido:
```ts
export const novoSchema = z.object({ ... });
export type NovoInput = z.infer<typeof novoSchema>;
```

---

## Componentes UI disponíveis

Todos estão em `components/ui/`. Use-os antes de criar novos.

| Componente | Props principais | Uso |
|---|---|---|
| `Button` | `variant` (primary/secondary/danger/ghost), `size` (sm/md/lg) | Qualquer botão |
| `Input` | `label`, `error` | Campos de texto, número, data |
| `Select` | `label`, `error`, `options[]`, `placeholder` | Selects |
| `Card` | `padding` (sm/md/lg) | Container com borda e sombra |
| `Modal` | `open`, `onClose`, `title`, `footer` | Diálogos e formulários flutuantes |
| `ConfirmModal` | `open`, `onClose`, `onConfirm`, `title`, `message` | Confirmação de exclusão |
| `Badge` | `color` (hex), `className` | Tags/etiquetas |
| `EmptyState` | `icon`, `title`, `description`, `action` | Estado vazio de listas |
| `Skeleton` | `className` | Loading genérico |
| `CardSkeleton` | — | Loading de card de resumo |
| `ListSkeleton` | `count` | Loading de lista |

Utilitário de classes: `cn(...classes)` em `lib/utils.ts`.

---

## Modelo de dados

```
Categoria  ──< Despesa
           ──< Receita

Categoria: id, nome, tipo (DESPESA|RECEITA), icone, cor, ativa, createdAt, updatedAt

Despesa: id, descricao, valor (Decimal), data, categoriaId, tipoGasto (FIXO|VARIAVEL),
         fornecedor?, observacao?, recorrente, createdAt, updatedAt

Receita: id, descricao, valor (Decimal), data, categoriaId,
         formaPagamento (DINHEIRO|PIX|CARTAO_CREDITO|CARTAO_DEBITO|TRANSFERENCIA|BOLETO|CONVENIO),
         paciente?, observacao?, createdAt, updatedAt
```

- Categorias têm **soft delete** — use `DELETE /api/categorias/[id]` que seta `ativa: false`.
- `valor` é `Decimal` no Prisma — use `Number(registro.valor)` para converter em JS.
- Datas vêm como ISO string da API — use `formatDate()` para exibir e `toInputDate()` para preencher inputs.

---

## Como adicionar uma nova funcionalidade

### Nova página autenticada
1. Crie `app/(dashboard)/nova-rota/page.tsx` com `"use client"` e o padrão de loading/empty/lista.
2. Adicione o link em `components/layout/Sidebar.tsx` (desktop) e `components/layout/MobileNav.tsx` (mobile).

### Novo endpoint
1. Crie `app/api/novo-recurso/route.ts` com os handlers `GET`/`POST`.
2. Para CRUD completo, crie também `app/api/novo-recurso/[id]/route.ts` com `PUT`/`DELETE`.
3. Adicione o schema Zod em `lib/validators.ts`.

### Novo campo no banco
1. Edite `prisma/schema.prisma`.
2. Rode `npx prisma migrate dev --name nome-da-migration`.
3. Rode `npx prisma generate`.
4. Atualize os schemas Zod em `lib/validators.ts` e os handlers da API correspondentes.

### Novo componente UI
- Se for genérico e reutilizável: `components/ui/NomeComponente.tsx`.
- Se for específico de uma seção: `components/dashboard/`, `components/forms/`, etc.
- Não use `"use client"` em componentes puramente estáticos sem event handlers.

---

## Estilo e identidade visual

- Paleta principal: `blue-600` (ações), `green-600` (receitas/positivo), `red-500` (despesas/negativo), `gray-*` (neutro)
- Bordas: `rounded-xl` (campos) e `rounded-2xl` (cards/listas)
- Sombra padrão de card: `shadow-sm border border-gray-100`
- Fontes: variável CSS `--font-geist` via `next/font/google`
- Mobile-first: classes base para mobile, `md:` para desktop
- Espaçamento padrão entre seções: `space-y-4`

---

## Localização

- Moeda: sempre `formatCurrency(valor)` de `lib/utils.ts` — retorna `R$ 1.234,56`
- Datas: sempre `formatDate(data)` — retorna `dd/mm/aaaa`
- Inputs de data: `type="date"` com `toInputDate(data)` para o `value`
- Inputs de valor monetário: `type="number"`, `step="0.01"`, `inputMode="decimal"`

---

## O que NÃO fazer

- Não instale uma biblioteca nova sem verificar se já existe uma forma de fazer com o que está instalado.
- Não crie `app/page.tsx` — conflita com `app/(dashboard)/page.tsx`.
- Não coloque `url` no datasource do `schema.prisma` (Prisma v7).
- Não use `middleware.ts` — este projeto usa `proxy.ts` (Next.js 16).
- Não faça cast direto de `Decimal` do Prisma para string sem `Number()` ou `.toNumber()`.
- Não esqueça de `await params` nas rotas dinâmicas (`{ params }: { params: Promise<{ id: string }> }`).
- Não passe `zodResolver(schema)` diretamente ao `useForm` — declare como `const resolver = zodResolver(schema) as any` fora do componente.
