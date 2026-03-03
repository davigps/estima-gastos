import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockDespesa, validDespesaPayload, mockCategoriaDespesa } from "../helpers/fixtures";

const mockPrisma = vi.hoisted(() => ({
  despesa: {
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn().mockResolvedValue({ _sum: { valor: null } }),
    groupBy: vi.fn().mockResolvedValue([]),
  },
  categoria: {
    findMany: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { GET, POST } from "@/app/api/despesas/route";
import { PUT, DELETE } from "@/app/api/despesas/[id]/route";

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.despesa.findMany.mockResolvedValue([]);
  mockPrisma.despesa.count.mockResolvedValue(0);
});

describe("GET /api/despesas", () => {
  it("retorna lista paginada com defaults (page=1, limit=50)", async () => {
    mockPrisma.despesa.findMany.mockResolvedValue([mockDespesa]);
    mockPrisma.despesa.count.mockResolvedValue(1);

    const req = new NextRequest("http://localhost/api/despesas");
    const response = await GET(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.page).toBe(1);
    expect(data.limit).toBe(50);
    expect(data.total).toBe(1);
    expect(data.despesas).toHaveLength(1);
  });

  it("filtra por categoriaId", async () => {
    const req = new NextRequest("http://localhost/api/despesas?categoriaId=cat-1");
    await GET(req);

    const [findCall] = mockPrisma.despesa.findMany.mock.calls;
    expect(findCall[0].where.categoriaId).toBe("cat-1");
  });

  it("filtra por tipoGasto", async () => {
    const req = new NextRequest("http://localhost/api/despesas?tipoGasto=FIXO");
    await GET(req);

    const [findCall] = mockPrisma.despesa.findMany.mock.calls;
    expect(findCall[0].where.tipoGasto).toBe("FIXO");
  });

  it("filtra por year + month com datas UTC", async () => {
    const req = new NextRequest("http://localhost/api/despesas?year=2026&month=3");
    await GET(req);

    const [findCall] = mockPrisma.despesa.findMany.mock.calls;
    const { gte, lte } = findCall[0].where.data;
    // Bug 1 CORRIGIDO: datas devem ser UTC
    // BUG ENCONTRADO E CORRIGIDO: usar Date.UTC para evitar deslocamento de timezone
    // Fix aplicado em: app/api/despesas/route.ts
    expect(gte.toISOString()).toBe("2026-03-01T00:00:00.000Z");
    expect(lte.toISOString()).toContain("2026-03-31");
  });

  it("paginação: page=2, limit=10 → skip=10, take=10", async () => {
    const req = new NextRequest("http://localhost/api/despesas?page=2&limit=10");
    await GET(req);

    const [findCall] = mockPrisma.despesa.findMany.mock.calls;
    expect(findCall[0].skip).toBe(10);
    expect(findCall[0].take).toBe(10);
  });

  it("retorna total para paginação", async () => {
    mockPrisma.despesa.count.mockResolvedValue(100);
    const req = new NextRequest("http://localhost/api/despesas");
    const response = await GET(req);
    const data = await response.json();
    expect(data.total).toBe(100);
  });

  // Bug potencial (Bug 4): year sem month (ou vice-versa) → filtro de data ignorado silenciosamente.
  // Comportamento atual: sem filtro de data. Documentado, não corrigido.
});

describe("POST /api/despesas", () => {
  it("payload válido → status 201, despesa criada com categoria", async () => {
    mockPrisma.despesa.create.mockResolvedValue(mockDespesa);

    const req = new NextRequest("http://localhost/api/despesas", {
      method: "POST",
      body: JSON.stringify(validDespesaPayload),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req);
    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.id).toBe("despesa-1");
    expect(data.categoria).toBeDefined();
  });

  it("payload inválido → status 400 com erros Zod", async () => {
    const req = new NextRequest("http://localhost/api/despesas", {
      method: "POST",
      body: JSON.stringify({ descricao: "", valor: -1 }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it("data é convertida para Date object", async () => {
    mockPrisma.despesa.create.mockResolvedValue(mockDespesa);

    const req = new NextRequest("http://localhost/api/despesas", {
      method: "POST",
      body: JSON.stringify(validDespesaPayload),
      headers: { "Content-Type": "application/json" },
    });

    await POST(req);

    const [createCall] = mockPrisma.despesa.create.mock.calls;
    expect(createCall[0].data.data).toBeInstanceOf(Date);
  });

  // Bug potencial (Bug 2): categoriaId inexistente → Prisma lança FK error → status 500 genérico.
  // Deveria retornar 400 com mensagem amigável. Documentado, não corrigido.
});

describe("PUT /api/despesas/[id]", () => {
  it("atualiza despesa existente → status 200", async () => {
    mockPrisma.despesa.update.mockResolvedValue(mockDespesa);

    const req = new NextRequest("http://localhost/api/despesas/despesa-1", {
      method: "PUT",
      body: JSON.stringify(validDespesaPayload),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PUT(req, { params: Promise.resolve({ id: "despesa-1" }) });
    expect(response.status).toBe(200);
  });

  it("payload inválido → status 400", async () => {
    const req = new NextRequest("http://localhost/api/despesas/despesa-1", {
      method: "PUT",
      body: JSON.stringify({ descricao: "" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PUT(req, { params: Promise.resolve({ id: "despesa-1" }) });
    expect(response.status).toBe(400);
  });

  it("ID inexistente → status 404", async () => {
    // BUG ENCONTRADO E CORRIGIDO: route now catches Prisma P2025 and returns 404
    // Fix aplicado em: app/api/despesas/[id]/route.ts
    const notFoundError = Object.assign(new Error("Record not found"), { code: "P2025" });
    mockPrisma.despesa.update.mockRejectedValue(notFoundError);

    const req = new NextRequest("http://localhost/api/despesas/nonexistent", {
      method: "PUT",
      body: JSON.stringify(validDespesaPayload),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PUT(req, { params: Promise.resolve({ id: "nonexistent" }) });
    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/despesas/[id]", () => {
  it("deleta despesa → status 200", async () => {
    mockPrisma.despesa.delete.mockResolvedValue(mockDespesa);

    const req = new NextRequest("http://localhost/api/despesas/despesa-1", {
      method: "DELETE",
    });

    const response = await DELETE(req, { params: Promise.resolve({ id: "despesa-1" }) });
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({ ok: true });
  });

  it("ID inexistente → status 404", async () => {
    // BUG ENCONTRADO E CORRIGIDO: route now catches Prisma P2025 and returns 404
    // Fix aplicado em: app/api/despesas/[id]/route.ts
    const notFoundError = Object.assign(new Error("Record not found"), { code: "P2025" });
    mockPrisma.despesa.delete.mockRejectedValue(notFoundError);

    const req = new NextRequest("http://localhost/api/despesas/nonexistent", {
      method: "DELETE",
    });

    const response = await DELETE(req, { params: Promise.resolve({ id: "nonexistent" }) });
    expect(response.status).toBe(404);
  });
});
