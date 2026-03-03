import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockReceita, validReceitaPayload } from "../helpers/fixtures";

const mockPrisma = vi.hoisted(() => ({
  receita: {
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn().mockResolvedValue({ _sum: { valor: null } }),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { GET, POST } from "@/app/api/receitas/route";
import { PUT, DELETE } from "@/app/api/receitas/[id]/route";

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.receita.findMany.mockResolvedValue([]);
  mockPrisma.receita.count.mockResolvedValue(0);
});

describe("GET /api/receitas", () => {
  it("retorna lista paginada com defaults", async () => {
    mockPrisma.receita.findMany.mockResolvedValue([mockReceita]);
    mockPrisma.receita.count.mockResolvedValue(1);

    const req = new NextRequest("http://localhost/api/receitas");
    const response = await GET(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.page).toBe(1);
    expect(data.limit).toBe(50);
    expect(data.total).toBe(1);
    expect(data.receitas).toHaveLength(1);
  });

  it("filtra por formaPagamento", async () => {
    const req = new NextRequest("http://localhost/api/receitas?formaPagamento=PIX");
    await GET(req);

    const [findCall] = mockPrisma.receita.findMany.mock.calls;
    expect(findCall[0].where.formaPagamento).toBe("PIX");
  });

  it("filtra por categoriaId", async () => {
    const req = new NextRequest("http://localhost/api/receitas?categoriaId=cat-1");
    await GET(req);

    const [findCall] = mockPrisma.receita.findMany.mock.calls;
    expect(findCall[0].where.categoriaId).toBe("cat-1");
  });

  it("filtra por year + month com datas UTC", async () => {
    // BUG ENCONTRADO E CORRIGIDO: usar Date.UTC para timezone correto
    // Fix aplicado em: app/api/receitas/route.ts
    const req = new NextRequest("http://localhost/api/receitas?year=2026&month=3");
    await GET(req);

    const [findCall] = mockPrisma.receita.findMany.mock.calls;
    const { gte } = findCall[0].where.data;
    expect(gte.toISOString()).toBe("2026-03-01T00:00:00.000Z");
  });
});

describe("POST /api/receitas", () => {
  it("payload válido → status 201 com categoria", async () => {
    mockPrisma.receita.create.mockResolvedValue(mockReceita);

    const req = new NextRequest("http://localhost/api/receitas", {
      method: "POST",
      body: JSON.stringify(validReceitaPayload),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req);
    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.id).toBe("receita-1");
  });

  it("aceita todas as 7 formas de pagamento", async () => {
    const formas = ["DINHEIRO", "PIX", "CARTAO_CREDITO", "CARTAO_DEBITO", "TRANSFERENCIA", "BOLETO", "CONVENIO"];

    for (const forma of formas) {
      vi.clearAllMocks();
      mockPrisma.receita.create.mockResolvedValue({ ...mockReceita, formaPagamento: forma });

      const req = new NextRequest("http://localhost/api/receitas", {
        method: "POST",
        body: JSON.stringify({ ...validReceitaPayload, formaPagamento: forma }),
        headers: { "Content-Type": "application/json" },
      });

      const response = await POST(req);
      expect(response.status).toBe(201);
    }
  });

  it("payload inválido → status 400", async () => {
    const req = new NextRequest("http://localhost/api/receitas", {
      method: "POST",
      body: JSON.stringify({ descricao: "" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});

describe("PUT /api/receitas/[id]", () => {
  it("atualiza receita existente → status 200", async () => {
    mockPrisma.receita.update.mockResolvedValue(mockReceita);

    const req = new NextRequest("http://localhost/api/receitas/receita-1", {
      method: "PUT",
      body: JSON.stringify(validReceitaPayload),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PUT(req, { params: Promise.resolve({ id: "receita-1" }) });
    expect(response.status).toBe(200);
  });

  it("ID inexistente → status 404", async () => {
    // BUG ENCONTRADO E CORRIGIDO: route catches Prisma P2025 and returns 404
    // Fix aplicado em: app/api/receitas/[id]/route.ts
    const notFoundError = Object.assign(new Error("Record not found"), { code: "P2025" });
    mockPrisma.receita.update.mockRejectedValue(notFoundError);

    const req = new NextRequest("http://localhost/api/receitas/nonexistent", {
      method: "PUT",
      body: JSON.stringify(validReceitaPayload),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PUT(req, { params: Promise.resolve({ id: "nonexistent" }) });
    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/receitas/[id]", () => {
  it("deleta receita → status 200", async () => {
    mockPrisma.receita.delete.mockResolvedValue(mockReceita);

    const req = new NextRequest("http://localhost/api/receitas/receita-1", {
      method: "DELETE",
    });

    const response = await DELETE(req, { params: Promise.resolve({ id: "receita-1" }) });
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({ ok: true });
  });

  it("ID inexistente → status 404", async () => {
    // BUG ENCONTRADO E CORRIGIDO: route catches Prisma P2025 and returns 404
    // Fix aplicado em: app/api/receitas/[id]/route.ts
    const notFoundError = Object.assign(new Error("Record not found"), { code: "P2025" });
    mockPrisma.receita.delete.mockRejectedValue(notFoundError);

    const req = new NextRequest("http://localhost/api/receitas/nonexistent", {
      method: "DELETE",
    });

    const response = await DELETE(req, { params: Promise.resolve({ id: "nonexistent" }) });
    expect(response.status).toBe(404);
  });
});
