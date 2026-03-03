import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockCategoriaDespesa, mockCategoriaReceita } from "../helpers/fixtures";

const mockPrisma = vi.hoisted(() => ({
  despesa: {
    findMany: vi.fn().mockResolvedValue([]),
    aggregate: vi.fn().mockResolvedValue({ _sum: { valor: null } }),
  },
  receita: {
    findMany: vi.fn().mockResolvedValue([]),
    aggregate: vi.fn().mockResolvedValue({ _sum: { valor: null } }),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { GET } from "@/app/api/relatorios/route";

const makeDespesa = (valor: number, tipoGasto: "FIXO" | "VARIAVEL", categoriaId = "cat-despesa-1") => ({
  id: `d-${Math.random()}`,
  valor,
  tipoGasto,
  categoriaId,
  categoria: { ...mockCategoriaDespesa, id: categoriaId },
  data: new Date("2026-03-15T00:00:00Z"),
  descricao: "Despesa",
  fornecedor: null,
  observacao: null,
  recorrente: false,
  criadaEm: new Date(),
});

const makeReceita = (valor: number, formaPagamento = "PIX", categoriaId = "cat-receita-1") => ({
  id: `r-${Math.random()}`,
  valor,
  formaPagamento,
  categoriaId,
  categoria: { ...mockCategoriaReceita, id: categoriaId },
  data: new Date("2026-03-15T00:00:00Z"),
  descricao: "Receita",
  paciente: null,
  observacao: null,
  criadaEm: new Date(),
});

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.despesa.findMany.mockResolvedValue([]);
  mockPrisma.receita.findMany.mockResolvedValue([]);
  mockPrisma.despesa.aggregate.mockResolvedValue({ _sum: { valor: null } });
  mockPrisma.receita.aggregate.mockResolvedValue({ _sum: { valor: null } });
});

describe("GET /api/relatorios", () => {
  it("retorna estrutura DRE completa", async () => {
    const req = new NextRequest("http://localhost/api/relatorios?year=2026&startMonth=1&endMonth=3");
    const response = await GET(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.dre).toHaveProperty("totalReceitas");
    expect(data.dre).toHaveProperty("totalDespesasFixas");
    expect(data.dre).toHaveProperty("totalDespesasVariaveis");
    expect(data.dre).toHaveProperty("totalDespesas");
    expect(data.dre).toHaveProperty("resultado");
    expect(data.dre).toHaveProperty("percentualOverhead");
  });

  it("DRE: totalReceitas, despesasFixas, despesasVariaveis, resultado corretos", async () => {
    mockPrisma.receita.findMany.mockResolvedValue([makeReceita(1000)]);
    mockPrisma.despesa.findMany.mockResolvedValue([
      makeDespesa(300, "FIXO"),
      makeDespesa(200, "VARIAVEL"),
    ]);
    mockPrisma.despesa.aggregate.mockResolvedValue({ _sum: { valor: null } });
    mockPrisma.receita.aggregate.mockResolvedValue({ _sum: { valor: null } });

    const req = new NextRequest("http://localhost/api/relatorios?year=2026&startMonth=3&endMonth=3");
    const response = await GET(req);
    const data = await response.json();

    expect(data.dre.totalReceitas).toBe(1000);
    expect(data.dre.totalDespesasFixas).toBe(300);
    expect(data.dre.totalDespesasVariaveis).toBe(200);
    expect(data.dre.totalDespesas).toBe(500);
    expect(data.dre.resultado).toBe(500);
  });

  it("percentualOverhead = (totalDespesas / totalReceitas) * 100", async () => {
    mockPrisma.receita.findMany.mockResolvedValue([makeReceita(1000)]);
    mockPrisma.despesa.findMany.mockResolvedValue([makeDespesa(400, "VARIAVEL")]);
    mockPrisma.despesa.aggregate.mockResolvedValue({ _sum: { valor: null } });
    mockPrisma.receita.aggregate.mockResolvedValue({ _sum: { valor: null } });

    const req = new NextRequest("http://localhost/api/relatorios?year=2026&startMonth=3&endMonth=3");
    const response = await GET(req);
    const data = await response.json();

    expect(data.dre.percentualOverhead).toBeCloseTo(40); // 400/1000 * 100
  });

  it("percentualOverhead = 0 quando totalReceitas = 0 (sem divisão por zero)", async () => {
    mockPrisma.receita.findMany.mockResolvedValue([]);
    mockPrisma.despesa.findMany.mockResolvedValue([makeDespesa(500, "FIXO")]);
    mockPrisma.despesa.aggregate.mockResolvedValue({ _sum: { valor: null } });
    mockPrisma.receita.aggregate.mockResolvedValue({ _sum: { valor: null } });

    const req = new NextRequest("http://localhost/api/relatorios?year=2026&startMonth=3&endMonth=3");
    const response = await GET(req);
    const data = await response.json();

    expect(data.dre.percentualOverhead).toBe(0);
  });

  it("despesasPorCategoria agrupa corretamente e calcula percentual", async () => {
    mockPrisma.receita.findMany.mockResolvedValue([makeReceita(1000)]);
    mockPrisma.despesa.findMany.mockResolvedValue([
      makeDespesa(300, "VARIAVEL", "cat-despesa-1"),
      makeDespesa(200, "FIXO", "cat-despesa-1"),
    ]);
    mockPrisma.despesa.aggregate.mockResolvedValue({ _sum: { valor: null } });
    mockPrisma.receita.aggregate.mockResolvedValue({ _sum: { valor: null } });

    const req = new NextRequest("http://localhost/api/relatorios?year=2026&startMonth=3&endMonth=3");
    const response = await GET(req);
    const data = await response.json();

    expect(data.despesasPorCategoria).toHaveLength(1);
    expect(data.despesasPorCategoria[0].total).toBe(500);
    expect(data.despesasPorCategoria[0].percentual).toBeCloseTo(50); // 500/1000 * 100
  });

  it("evolucao gera dados mês a mês no range", async () => {
    mockPrisma.despesa.aggregate.mockResolvedValue({ _sum: { valor: null } });
    mockPrisma.receita.aggregate.mockResolvedValue({ _sum: { valor: null } });

    const req = new NextRequest("http://localhost/api/relatorios?year=2026&startMonth=1&endMonth=3");
    const response = await GET(req);
    const data = await response.json();

    expect(data.evolucao).toHaveLength(3);
    expect(data.evolucao[0]).toHaveProperty("month");
    expect(data.evolucao[0]).toHaveProperty("despesas");
    expect(data.evolucao[0]).toHaveProperty("receitas");
    expect(data.evolucao[0]).toHaveProperty("saldo");
  });

  it("porFormaPagamento agrupa receitas por forma", async () => {
    mockPrisma.receita.findMany.mockResolvedValue([
      makeReceita(500, "PIX"),
      makeReceita(300, "PIX"),
      makeReceita(200, "DINHEIRO"),
    ]);
    mockPrisma.despesa.findMany.mockResolvedValue([]);
    mockPrisma.despesa.aggregate.mockResolvedValue({ _sum: { valor: null } });
    mockPrisma.receita.aggregate.mockResolvedValue({ _sum: { valor: null } });

    const req = new NextRequest("http://localhost/api/relatorios?year=2026&startMonth=3&endMonth=3");
    const response = await GET(req);
    const data = await response.json();

    const pix = data.porFormaPagamento.find((p: { forma: string }) => p.forma === "PIX");
    const dinheiro = data.porFormaPagamento.find((p: { forma: string }) => p.forma === "DINHEIRO");
    expect(pix.total).toBe(800);
    expect(dinheiro.total).toBe(200);
  });

  // Bug potencial (Bug 6): startMonth > endMonth (cross-year) → array vazio.
  // Não suporta ranges que cruzam anos. Documentado, não corrigido.

  // Bug 1 CORRIGIDO: datas UTC para evitar deslocamento de timezone.
  // Fix aplicado em: app/api/relatorios/route.ts
  it("datas de filtro usam UTC", async () => {
    const req = new NextRequest("http://localhost/api/relatorios?year=2026&startMonth=3&endMonth=3");
    await GET(req);

    const [findDespesasCall] = mockPrisma.despesa.findMany.mock.calls;
    const { gte } = findDespesasCall[0].where.data;
    expect(gte.toISOString()).toBe("2026-03-01T00:00:00.000Z");
  });
});
