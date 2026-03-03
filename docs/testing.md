# Plano de Testes — Estima Odontologia

## Stack de Testes

| Camada | Ferramenta | Motivo |
|--------|-----------|--------|
| Unit + Integration | Vitest | Rápido, compatível com ESM/TypeScript, API similar ao Jest |
| API Routes | Vitest + `next/test` ou fetch direto | Testar handlers isolados |
| Componentes React | Vitest + React Testing Library | Renderização e interação |
| E2E | Playwright | Fluxos completos no browser |

---

## Passo 0 — Setup do Ambiente de Testes

1. Instalar dependências:
   ```bash
   pnpm add -D vitest @vitejs/plugin-react jsdom \
     @testing-library/react @testing-library/jest-dom @testing-library/user-event \
     playwright @playwright/test
   ```

2. Criar `vitest.config.ts` na raiz:
   ```ts
   import { defineConfig } from "vitest/config";
   import react from "@vitejs/plugin-react";
   import path from "path";

   export default defineConfig({
     plugins: [react()],
     test: {
       environment: "jsdom",
       globals: true,
       setupFiles: ["./tests/setup.ts"],
       alias: {
         "@": path.resolve(__dirname, "."),
       },
     },
   });
   ```

3. Criar `tests/setup.ts`:
   ```ts
   import "@testing-library/jest-dom/vitest";
   ```

4. Criar `tests/helpers/prisma-mock.ts` — factory para mock do Prisma:
   ```ts
   import { vi } from "vitest";

   export function createPrismaMock() {
     return {
       despesa: {
         findMany: vi.fn().mockResolvedValue([]),
         create: vi.fn(),
         update: vi.fn(),
         delete: vi.fn(),
         count: vi.fn().mockResolvedValue(0),
         aggregate: vi.fn().mockResolvedValue({ _sum: { valor: null } }),
         groupBy: vi.fn().mockResolvedValue([]),
       },
       receita: {
         findMany: vi.fn().mockResolvedValue([]),
         create: vi.fn(),
         update: vi.fn(),
         delete: vi.fn(),
         count: vi.fn().mockResolvedValue(0),
         aggregate: vi.fn().mockResolvedValue({ _sum: { valor: null } }),
       },
       categoria: {
         findMany: vi.fn().mockResolvedValue([]),
         create: vi.fn(),
         update: vi.fn(),
         delete: vi.fn(),
       },
     };
   }
   ```

5. Adicionar scripts ao `package.json`:
   ```json
   {
     "scripts": {
       "test": "vitest run",
       "test:watch": "vitest",
       "test:coverage": "vitest run --coverage",
       "test:e2e": "playwright test"
     }
   }
   ```

6. Criar `playwright.config.ts` (para E2E, fase final).

7. Criar estrutura de diretórios:
   ```
   tests/
   ├── setup.ts
   ├── helpers/
   │   ├── prisma-mock.ts
   │   └── fixtures.ts          # dados de teste reutilizáveis
   ├── unit/
   │   ├── utils.test.ts
   │   ├── validators.test.ts
   │   └── auth.test.ts
   ├── api/
   │   ├── despesas.test.ts
   │   ├── receitas.test.ts
   │   ├── categorias.test.ts
   │   ├── dashboard.test.ts
   │   ├── relatorios.test.ts
   │   └── auth-routes.test.ts
   ├── components/
   │   ├── forms/
   │   │   ├── DespesaForm.test.tsx
   │   │   └── ReceitaForm.test.tsx
   │   ├── ui/
   │   │   ├── Modal.test.tsx
   │   │   └── Badge.test.tsx
   │   └── dashboard/
   │       └── ResumoCards.test.tsx
   └── e2e/
       ├── login.spec.ts
       ├── despesas-crud.spec.ts
       ├── receitas-crud.spec.ts
       └── relatorios.spec.ts
   ```

---

## Passo 1 — Testes Unitários: `lib/utils.ts`

**Arquivo:** `tests/unit/utils.test.ts`

### Casos de teste:

#### `formatCurrency`
- [ ] Formata número inteiro: `1000` → `"R$ 1.000,00"`
- [ ] Formata decimal: `1234.56` → `"R$ 1.234,56"`
- [ ] Formata zero: `0` → `"R$ 0,00"`
- [ ] Formata número negativo: `-500` → `"-R$ 500,00"`
- [ ] Aceita string numérica: `"1500.50"` → `"R$ 1.500,50"`
- [ ] Aceita objeto com `.toNumber()` (Prisma Decimal): `{ toNumber: () => 99.9 }`
- [ ] **Bug potencial:** string não-numérica (`"abc"`) → verificar se retorna `"R$ NaN"` ou se deveria tratar

#### `formatDate`
- [ ] Formata Date object: `new Date("2026-03-15T00:00:00Z")` → `"15/03/2026"`
- [ ] Formata string ISO: `"2026-01-01T00:00:00Z"` → `"01/01/2026"`
- [ ] **Bug potencial — timezone:** `new Date("2026-03-15")` (sem Z) pode mostrar dia anterior dependendo do fuso. Verificar se a formatação UTC é consistente com datas criadas via `new Date(year, month, day)` (que usa horário local, não UTC).

#### `formatMonth`
- [ ] Formata mês/ano: `"2026-06-01T00:00:00Z"` → contém `"jun"` e `"2026"`
- [ ] Mês de janeiro e dezembro (limites)

#### `toInputDate`
- [ ] Retorna formato `YYYY-MM-DD`: `new Date("2026-03-15T00:00:00Z")` → `"2026-03-15"`
- [ ] **Bug potencial — timezone:** `new Date(2026, 2, 15)` (local midnight) pode retornar `"2026-03-14"` se UTC estiver no dia anterior. A função usa `.toISOString()` que converte para UTC, mas a data pode ter sido criada em horário local.

#### `cn`
- [ ] Junta classes: `cn("a", "b")` → `"a b"`
- [ ] Filtra undefined: `cn("a", undefined, "b")` → `"a b"`
- [ ] Filtra false: `cn("a", false, "b")` → `"a b"`
- [ ] Filtra null: `cn("a", null)` → `"a"`
- [ ] Sem argumentos: `cn()` → `""`

---

## Passo 2 — Testes Unitários: `lib/validators.ts`

**Arquivo:** `tests/unit/validators.test.ts`

### `despesaSchema`
- [ ] Aceita payload válido completo
- [ ] Aceita payload mínimo (só campos obrigatórios)
- [ ] Aplica defaults: `tipoGasto` → `"VARIAVEL"`, `recorrente` → `false`
- [ ] Rejeita descrição vazia → erro `"Descrição obrigatória"`
- [ ] Rejeita valor zero → erro `"Valor deve ser positivo"`
- [ ] Rejeita valor negativo
- [ ] Rejeita data vazia
- [ ] Rejeita categoriaId vazia
- [ ] Rejeita tipoGasto inválido (ex: `"OUTRO"`)
- [ ] **Bug potencial:** `valor` aceita `0.001` (3 casas decimais) mas o banco é `Decimal(10,2)`. O schema não valida precisão — verificar se o Prisma arredonda silenciosamente ou se gera erro.

### `receitaSchema`
- [ ] Aceita payload válido com cada `formaPagamento`
- [ ] Rejeita `formaPagamento` inválida (ex: `"CHEQUE"`)
- [ ] Campos opcionais (`paciente`, `observacao`) podem ser omitidos
- [ ] **Bug potencial:** `receitaSchema` não tem campo `recorrente` nem default. Se o frontend enviar `recorrente: true`, o Zod vai ignorar silenciosamente (strip). Verificar se isso é intencional.

### `categoriaSchema`
- [ ] Aceita categoria válida tipo DESPESA
- [ ] Aceita categoria válida tipo RECEITA
- [ ] Rejeita tipo inválido
- [ ] Rejeita nome vazio
- [ ] Campos opcionais (`icone`, `cor`) podem ser omitidos

---

## Passo 3 — Testes Unitários: `lib/auth.ts`

**Arquivo:** `tests/unit/auth.test.ts`

Requer mock de `process.env.JWT_SECRET`.

- [ ] `signToken` gera string JWT válida
- [ ] `verifyToken` valida token gerado por `signToken`
- [ ] `verifyToken` retorna `null` para token expirado (mock de tempo)
- [ ] `verifyToken` retorna `null` para token com secret diferente
- [ ] `verifyToken` retorna `null` para string aleatória
- [ ] `verifyToken` retorna `null` para string vazia
- [ ] Token contém payload passado na assinatura

---

## Passo 4 — Testes de API Routes

Estratégia: importar diretamente as funções `GET`/`POST`/`PUT`/`DELETE` dos route handlers e chamá-las com `NextRequest` mockado. Mockar `@/lib/prisma` via `vi.mock`.

### 4.1 — `tests/api/auth-routes.test.ts`

#### POST `/api/auth/login`
- [ ] Senha correta → status 200, retorna `{ ok: true }`, set-cookie com `session`
- [ ] Senha incorreta → status 401, retorna `{ error: "Senha incorreta" }`
- [ ] Body sem password → status 401
- [ ] **Bug potencial:** não há rate limiting. Pode permitir brute force. (Não é bug de lógica, mas anotar como melhoria de segurança.)

#### POST `/api/auth/logout`
- [ ] Retorna 200 com `{ ok: true }`
- [ ] Cookie `session` definido com `maxAge: 0`

### 4.2 — `tests/api/despesas.test.ts`

#### GET `/api/despesas`
- [ ] Retorna lista paginada (default page=1, limit=50)
- [ ] Filtra por `categoriaId`
- [ ] Filtra por `tipoGasto`
- [ ] Filtra por `year` + `month`
- [ ] Paginação: `page=2, limit=10` → `skip: 10, take: 10`
- [ ] Retorna `total` para paginação no frontend
- [ ] **Bug potencial:** se `year` é fornecido sem `month` (ou vice-versa), o filtro de data não é aplicado. Verificar se é intencional ou se deveria retornar erro.

#### POST `/api/despesas`
- [ ] Payload válido → status 201, despesa criada com categoria incluída
- [ ] Payload inválido → status 400 com erros do Zod
- [ ] `data` é convertida para Date: `new Date(d.data)`
- [ ] **Bug potencial:** se `categoriaId` referencia categoria inexistente, o Prisma vai lançar foreign key error. A rota não trata isso — o erro 500 genérico vai para o cliente. Verificar se deveria retornar 400 com mensagem amigável.

### 4.3 — `tests/api/receitas.test.ts`

Mesma estrutura do 4.2, adaptado para receitas:
- [ ] GET com filtro `formaPagamento`
- [ ] POST com todas as 7 formas de pagamento
- [ ] **Bug potencial:** mesmos problemas de `year` sem `month` e `categoriaId` inexistente

### 4.4 — `tests/api/categorias.test.ts`

#### GET `/api/categorias`
- [ ] Retorna todas as categorias ativas por padrão
- [ ] Filtra por `tipo=DESPESA`
- [ ] Filtra por `tipo=RECEITA`
- [ ] `ativas=false` retorna também inativas

#### POST `/api/categorias`
- [ ] Cria categoria válida → 201
- [ ] Payload inválido → 400

#### PUT `/api/categorias/[id]`
- [ ] Atualiza categoria existente
- [ ] **Bug potencial:** ID inexistente → verificar se retorna 404 ou 500

#### DELETE `/api/categorias/[id]`
- [ ] Soft delete: atualiza `ativa: false`, não remove do banco
- [ ] **Bug potencial:** ID inexistente → mesmo problema do PUT

### 4.5 — `tests/api/dashboard.test.ts`

- [ ] Retorna totais do mês corrente quando sem parâmetros
- [ ] Retorna totais para mês/ano específico
- [ ] `variacaoDespesas` calculada corretamente: `((atual - anterior) / anterior) * 100`
- [ ] `variacaoDespesas` é `null` quando mês anterior tem despesas = 0
- [ ] `variacaoReceitas` segue mesma lógica
- [ ] `saldo` = `totalReceitas - totalDespesas`
- [ ] `topCategorias` limitado a 5, ordenado por valor desc
- [ ] `topCategorias[].percentualReceita` calculado sobre totalReceitas
- [ ] `historico` tem 6 meses, em ordem cronológica (reverse aplicado)
- [ ] **Bug potencial — timezone:** `new Date(year, month - 1, 1)` cria data em horário local do servidor. Se o servidor está em UTC-3 (Brasil), `new Date(2026, 0, 1)` = `2025-12-31T03:00:00Z`. Datas no banco (se armazenadas em UTC) podem cair fora do range. Isso pode causar despesas/receitas do dia 1 não aparecerem no dashboard, ou itens do mês anterior serem incluídos indevidamente.
- [ ] **Bug potencial — janeiro:** quando `month=1`, `startOfPrevMonth = new Date(year, -1, 1)` — o JavaScript resolve para dezembro do ano anterior, o que é correto. Mas vale testar explicitamente.

### 4.6 — `tests/api/relatorios.test.ts`

- [ ] DRE: totalReceitas, totalDespesasFixas, totalDespesasVariaveis, resultado
- [ ] `percentualOverhead` = `(totalDespesas / totalReceitas) * 100`
- [ ] `percentualOverhead` = 0 quando totalReceitas = 0 (sem divisão por zero)
- [ ] `despesasPorCategoria` agrupa corretamente e calcula percentual
- [ ] `evolucao` gera dados mês a mês no range
- [ ] `porFormaPagamento` agrupa receitas por forma
- [ ] **Bug potencial:** `endMonth - startMonth + 1` não funciona se `startMonth > endMonth` (ex: pesquisa de Nov a Jan do próximo ano). Resultado seria length negativo → array vazio. Verificar se o frontend impede ou se deveria tratar.
- [ ] **Bug potencial — timezone:** mesmo problema do dashboard com `new Date(year, m - 1, 1)` em horário local.

---

## Passo 5 — Testes de Componentes React

### 5.1 — `tests/components/forms/DespesaForm.test.tsx`

- [ ] Renderiza todos os campos do formulário
- [ ] Campos obrigatórios mostram erro de validação ao submeter vazio
- [ ] Submete com dados válidos — chama `onSubmit` com payload correto
- [ ] Modo edição: preenche campos com valores existentes
- [ ] Botão fica desabilitado durante loading
- [ ] Select de categorias mostra opções carregadas
- [ ] Checkbox "Recorrente" funciona

### 5.2 — `tests/components/forms/ReceitaForm.test.tsx`

- [ ] Mesma estrutura do DespesaForm
- [ ] Select de `formaPagamento` mostra todas as 7 opções
- [ ] Campo `paciente` é opcional

### 5.3 — `tests/components/ui/Modal.test.tsx`

- [ ] Renderiza conteúdo quando `open=true`
- [ ] Não renderiza quando `open=false`
- [ ] Chama `onClose` ao clicar no overlay/backdrop
- [ ] Chama `onClose` ao pressionar Escape
- [ ] `ConfirmModal`: botão "Confirmar" chama `onConfirm`
- [ ] `ConfirmModal`: botão "Cancelar" chama `onClose`

### 5.4 — `tests/components/dashboard/ResumoCards.test.tsx`

- [ ] Renderiza 3 cards: Receitas, Despesas, Saldo
- [ ] Formata valores como moeda (BRL)
- [ ] Mostra variação percentual quando disponível
- [ ] Mostra "—" ou similar quando variação é `null`
- [ ] Saldo positivo tem estilo verde, negativo vermelho

---

## Passo 6 — Testes E2E com Playwright

### Setup
- Banco de teste dedicado (`DATABASE_URL_TEST`)
- Script de seed para dados de teste
- `AUTH_PASSWORD=test123` no `.env.test`

### 6.1 — `tests/e2e/login.spec.ts`
- [ ] Redireciona para `/login` quando não autenticado
- [ ] Login com senha correta → redireciona para dashboard
- [ ] Login com senha incorreta → mostra erro
- [ ] Logout limpa sessão e redireciona para login

### 6.2 — `tests/e2e/despesas-crud.spec.ts`
- [ ] Cria nova despesa pelo formulário
- [ ] Despesa aparece na lista após criação
- [ ] Edita despesa existente
- [ ] Deleta despesa com confirmação
- [ ] Filtra por mês/ano
- [ ] Filtra por categoria

### 6.3 — `tests/e2e/receitas-crud.spec.ts`
- [ ] Mesma estrutura das despesas
- [ ] Filtra por forma de pagamento

### 6.4 — `tests/e2e/relatorios.spec.ts`
- [ ] Seleciona período e gera relatório
- [ ] DRE mostra valores corretos
- [ ] Gráficos renderizam sem erro

---

## Bugs Potenciais Identificados (verificar durante implementação)

### Bug 1 — Timezone em Date Ranges (ALTA prioridade)
**Onde:** `api/dashboard/route.ts:10-13`, `api/relatorios/route.ts:11-12`, `api/despesas/route.ts:18-20`

`new Date(year, month - 1, 1)` cria datas em horário **local do servidor**, não UTC. Se o PostgreSQL armazena timestamps em UTC, o range do mês pode estar deslocado em até 3 horas (fuso Brasil). Isso pode causar:
- Despesas/receitas do dia 1 não aparecerem
- Itens do último dia do mês anterior serem incluídos

**Como verificar:** Criar despesa com `data = "2026-03-01T00:00:00Z"` e buscar com filtro mês=3, ano=2026. Se não aparecer, é bug.

**Fix potencial:** Usar datas UTC explícitas: `new Date(Date.UTC(year, month - 1, 1))`.

### Bug 2 — Foreign Key não tratada (MÉDIA prioridade)
**Onde:** `api/despesas/route.ts:46`, `api/receitas/route.ts:46`

POST com `categoriaId` inexistente causa erro 500 genérico do Prisma. Deveria retornar 400 com mensagem amigável.

### Bug 3 — PUT/DELETE sem 404 (MÉDIA prioridade)
**Onde:** `api/categorias/[id]/route.ts`, `api/despesas/[id]/route.ts`, `api/receitas/[id]/route.ts`

Operações em IDs inexistentes provavelmente retornam erro 500 do Prisma ao invés de 404.

### Bug 4 — Filtro parcial year/month (BAIXA prioridade)
**Onde:** `api/despesas/route.ts:17`, `api/receitas/route.ts:17`

Condição `if (year && month)` ignora silenciosamente quando só um é fornecido. Pode confundir consumidor da API.

### Bug 5 — Valor com precisão excessiva (BAIXA prioridade)
**Onde:** `lib/validators.ts:5`

Schema aceita `valor: 10.999` mas banco é `Decimal(10,2)`. Prisma arredonda silenciosamente. Pode causar inconsistência entre o que o usuário digitou e o que foi salvo.

### Bug 6 — Relatórios cross-year (BAIXA prioridade)
**Onde:** `api/relatorios/route.ts:52`

Se `startMonth > endMonth` (ex: consulta Nov→Jan), `endMonth - startMonth + 1` resulta em número negativo → array vazio. Não há suporte para ranges que cruzam anos.

---

## Ordem de Implementação Recomendada

| Ordem | O que | Por quê | Esforço |
|-------|-------|---------|---------|
| 1 | Passo 0 — Setup | Fundação para tudo | Pequeno |
| 2 | Passo 1 — `utils.test.ts` | Funções puras, fácil de testar, valida setup | Pequeno |
| 3 | Passo 2 — `validators.test.ts` | Funções puras, alta importância | Pequeno |
| 4 | Passo 3 — `auth.test.ts` | Segurança, crítico | Pequeno |
| 5 | Passo 4.1 — Auth routes | Segurança, depende do passo 3 | Médio |
| 6 | Passo 4.5 — Dashboard API | Lógica mais complexa, mais provável ter bugs | Médio |
| 7 | Passo 4.6 — Relatórios API | Segunda mais complexa | Médio |
| 8 | Passo 4.2 — Despesas API | CRUD padrão | Médio |
| 9 | Passo 4.3 — Receitas API | Similar ao anterior | Médio |
| 10 | Passo 4.4 — Categorias API | CRUD simples | Pequeno |
| 11 | Passo 5 — Componentes | Requer RTL configurado | Grande |
| 12 | Passo 6 — E2E | Requer app rodando + banco de teste | Grande |

---

## Checklist para Cada Teste Implementado

Ao implementar cada caso de teste, o implementador deve:

1. **Escrever o teste** seguindo o caso descrito acima
2. **Rodar o teste** e verificar se passa
3. **Se falhar, analisar se é bug no código ou no teste:**
   - Se for bug no código da aplicação → **conserte o bug primeiro**, depois confirme que o teste passa
   - Se for erro no teste → ajuste o teste
4. **Documentar bugs encontrados** como comentário no teste:
   ```ts
   // BUG ENCONTRADO E CORRIGIDO: [descrição do bug]
   // Fix aplicado em: [arquivo:linha]
   ```
5. **Verificar cobertura** com `pnpm test:coverage` ao final de cada passo

---

## Meta de Cobertura

| Camada | Meta |
|--------|------|
| `lib/utils.ts` | 100% |
| `lib/validators.ts` | 100% |
| `lib/auth.ts` | 100% |
| API Routes | > 90% |
| Componentes | > 80% |
| E2E | Fluxos críticos cobertos |
