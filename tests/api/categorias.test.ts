import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockCategoriaDespesa, mockCategoriaReceita } from "../helpers/fixtures";

const mockPrisma = vi.hoisted(() => ({
  categoria: {
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { GET, POST } from "@/app/api/categorias/route";
import { PUT, DELETE } from "@/app/api/categorias/[id]/route";

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.categoria.findMany.mockResolvedValue([]);
});

describe("GET /api/categorias", () => {
  it("retorna todas as categorias ativas por padrão", async () => {
    mockPrisma.categoria.findMany.mockResolvedValue([mockCategoriaDespesa, mockCategoriaReceita]);

    const req = new NextRequest("http://localhost/api/categorias");
    const response = await GET(req);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.categorias).toHaveLength(2);

    const [findCall] = mockPrisma.categoria.findMany.mock.calls;
    expect(findCall[0].where.ativa).toBe(true);
  });

  it("filtra por tipo=DESPESA", async () => {
    const req = new NextRequest("http://localhost/api/categorias?tipo=DESPESA");
    await GET(req);

    const [findCall] = mockPrisma.categoria.findMany.mock.calls;
    expect(findCall[0].where.tipo).toBe("DESPESA");
  });

  it("filtra por tipo=RECEITA", async () => {
    const req = new NextRequest("http://localhost/api/categorias?tipo=RECEITA");
    await GET(req);

    const [findCall] = mockPrisma.categoria.findMany.mock.calls;
    expect(findCall[0].where.tipo).toBe("RECEITA");
  });

  it("ativas=false retorna também inativas", async () => {
    const req = new NextRequest("http://localhost/api/categorias?ativas=false");
    await GET(req);

    const [findCall] = mockPrisma.categoria.findMany.mock.calls;
    expect(findCall[0].where.ativa).toBeUndefined();
  });
});

describe("POST /api/categorias", () => {
  it("cria categoria válida → status 201", async () => {
    mockPrisma.categoria.create.mockResolvedValue(mockCategoriaDespesa);

    const req = new NextRequest("http://localhost/api/categorias", {
      method: "POST",
      body: JSON.stringify({ nome: "Material", tipo: "DESPESA" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req);
    expect(response.status).toBe(201);
  });

  it("payload inválido → status 400", async () => {
    const req = new NextRequest("http://localhost/api/categorias", {
      method: "POST",
      body: JSON.stringify({ nome: "", tipo: "INVALIDO" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});

describe("PUT /api/categorias/[id]", () => {
  it("atualiza categoria existente → status 200", async () => {
    mockPrisma.categoria.update.mockResolvedValue({ ...mockCategoriaDespesa, nome: "Novo Nome" });

    const req = new NextRequest("http://localhost/api/categorias/cat-1", {
      method: "PUT",
      body: JSON.stringify({ nome: "Novo Nome", tipo: "DESPESA" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PUT(req, { params: Promise.resolve({ id: "cat-1" }) });
    expect(response.status).toBe(200);
  });

  it("ID inexistente → status 404", async () => {
    // BUG ENCONTRADO E CORRIGIDO: route catches Prisma P2025 and returns 404
    // Fix aplicado em: app/api/categorias/[id]/route.ts
    const notFoundError = Object.assign(new Error("Record not found"), { code: "P2025" });
    mockPrisma.categoria.update.mockRejectedValue(notFoundError);

    const req = new NextRequest("http://localhost/api/categorias/nonexistent", {
      method: "PUT",
      body: JSON.stringify({ nome: "Nome", tipo: "DESPESA" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await PUT(req, { params: Promise.resolve({ id: "nonexistent" }) });
    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/categorias/[id]", () => {
  it("soft delete: atualiza ativa=false → status 200", async () => {
    mockPrisma.categoria.update.mockResolvedValue({ ...mockCategoriaDespesa, ativa: false });

    const req = new NextRequest("http://localhost/api/categorias/cat-1", {
      method: "DELETE",
    });

    const response = await DELETE(req, { params: Promise.resolve({ id: "cat-1" }) });
    expect(response.status).toBe(200);

    const [updateCall] = mockPrisma.categoria.update.mock.calls;
    expect(updateCall[0].data).toEqual({ ativa: false });

    const data = await response.json();
    expect(data).toEqual({ ok: true });
  });

  it("ID inexistente → status 404", async () => {
    // BUG ENCONTRADO E CORRIGIDO: route catches Prisma P2025 and returns 404
    // Fix aplicado em: app/api/categorias/[id]/route.ts
    const notFoundError = Object.assign(new Error("Record not found"), { code: "P2025" });
    mockPrisma.categoria.update.mockRejectedValue(notFoundError);

    const req = new NextRequest("http://localhost/api/categorias/nonexistent", {
      method: "DELETE",
    });

    const response = await DELETE(req, { params: Promise.resolve({ id: "nonexistent" }) });
    expect(response.status).toBe(404);
  });
});
