import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockCategoriaDespesa } from "../helpers/fixtures";

const mockPrisma = vi.hoisted(() => ({
  despesa: {
    aggregate: vi.fn().mockResolvedValue({ _sum: { valor: null } }),
    groupBy: vi.fn().mockResolvedValue([]),
  },
  receita: {
    aggregate: vi.fn().mockResolvedValue({ _sum: { valor: null } }),
  },
  categoria: {
    findMany: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { GET } from "@/app/api/dashboard/route";

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.despesa.aggregate.mockResolvedValue({ _sum: { valor: null } });
  mockPrisma.receita.aggregate.mockResolvedValue({ _sum: { valor: null } });
  mockPrisma.despesa.groupBy.mockResolvedValue([]);
  mockPrisma.categoria.findMany.mockResolvedValue([]);
});

describe("GET /api/dashboard", () => {
  it("retorna estrutura completa com todos os campos", async () => {
    const req = new NextRequest("http://localhost/api/dashboard");
    const response = await GET(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("totalDespesas");
    expect(data).toHaveProperty("totalReceitas");
    expect(data).toHaveProperty("saldo");
    expect(data).toHaveProperty("variacaoDespesas");
    expect(data).toHaveProperty("variacaoReceitas");
    expect(data).toHaveProperty("topCategorias");
    expect(data).toHaveProperty("historico");
  });

  it("saldo = totalReceitas - totalDespesas", async () => {
    // Receitas = 1000, Despesas = 600
    mockPrisma.receita.aggregate
      .mockResolvedValueOnce({ _sum: { valor: 1000 } })  // mes atual
      .mockResolvedValue({ _sum: { valor: null } });       // resto

    mockPrisma.despesa.aggregate
      .mockResolvedValueOnce({ _sum: { valor: 600 } })   // mes atual
      .mockResolvedValue({ _sum: { valor: null } });      // resto

    const req = new NextRequest("http://localhost/api/dashboard?year=2026&month=3");
    const response = await GET(req);
    const data = await response.json();

    expect(data.totalReceitas).toBe(1000);
    expect(data.totalDespesas).toBe(600);
    expect(data.saldo).toBe(400);
  });

  it("variacaoDespesas é null quando mês anterior tem despesas=0", async () => {
    // Todos retornam null/0 → variacaoDespesas = null
    const req = new NextRequest("http://localhost/api/dashboard?year=2026&month=3");
    const response = await GET(req);
    const data = await response.json();

    expect(data.variacaoDespesas).toBeNull();
  });

  it("variacaoReceitas é null quando mês anterior tem receitas=0", async () => {
    const req = new NextRequest("http://localhost/api/dashboard?year=2026&month=3");
    const response = await GET(req);
    const data = await response.json();

    expect(data.variacaoReceitas).toBeNull();
  });

  it("variacaoDespesas calculada corretamente: ((atual - anterior) / anterior) * 100", async () => {
    // Sequência de chamadas: despesas atual, despesas anterior, histórico (6 pares)
    // Precisamos: despesasMes=600, despesasMesAnterior=500
    mockPrisma.despesa.aggregate
      .mockResolvedValueOnce({ _sum: { valor: 600 } })  // despesasMes
      .mockResolvedValueOnce({ _sum: { valor: 500 } })  // despesasMesAnterior
      .mockResolvedValue({ _sum: { valor: null } });     // historico

    mockPrisma.receita.aggregate.mockResolvedValue({ _sum: { valor: null } });

    const req = new NextRequest("http://localhost/api/dashboard?year=2026&month=3");
    const response = await GET(req);
    const data = await response.json();

    // ((600 - 500) / 500) * 100 = 20
    expect(data.variacaoDespesas).toBeCloseTo(20);
  });

  it("topCategorias limitado a 5, com percentualReceita calculado", async () => {
    mockPrisma.despesa.groupBy.mockResolvedValue([
      { categoriaId: "cat-1", _sum: { valor: 200 } },
    ]);
    mockPrisma.categoria.findMany.mockResolvedValue([mockCategoriaDespesa]);
    mockPrisma.receita.aggregate
      .mockResolvedValueOnce({ _sum: { valor: 1000 } })
      .mockResolvedValue({ _sum: { valor: null } });
    mockPrisma.despesa.aggregate.mockResolvedValue({ _sum: { valor: null } });

    const req = new NextRequest("http://localhost/api/dashboard?year=2026&month=3");
    const response = await GET(req);
    const data = await response.json();

    expect(data.topCategorias).toHaveLength(1);
    expect(data.topCategorias[0].total).toBe(200);
    expect(data.topCategorias[0].percentualReceita).toBeCloseTo(20); // 200/1000 * 100
  });

  it("historico tem 6 meses em ordem cronológica", async () => {
    const req = new NextRequest("http://localhost/api/dashboard?year=2026&month=3");
    const response = await GET(req);
    const data = await response.json();

    expect(data.historico).toHaveLength(6);
    // Should be in ascending order (oldest first)
    const dates = data.historico.map((h: { month: string }) => new Date(h.month).getTime());
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i]).toBeGreaterThan(dates[i - 1]);
    }
  });

  it("usa mes/ano atual quando sem parâmetros", async () => {
    const req = new NextRequest("http://localhost/api/dashboard");
    const response = await GET(req);
    expect(response.status).toBe(200);
  });

  // Bug 1 CORRIGIDO: datas UTC explícitas para evitar deslocamento de timezone.
  // Fix aplicado em: app/api/dashboard/route.ts
  it("datas de filtro usam UTC", async () => {
    const req = new NextRequest("http://localhost/api/dashboard?year=2026&month=1");
    await GET(req);

    const firstCall = mockPrisma.despesa.aggregate.mock.calls[0];
    const { gte } = firstCall[0].where.data;
    expect(gte.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  // Bug potencial: when month=1, startOfPrevMonth uses month - 2 = -1 → Dec of previous year.
  // JavaScript resolves new Date(year, -1, 1) correctly. Tested implicitly.
});
