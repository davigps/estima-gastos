import { describe, it, expect } from "vitest";
import { despesaSchema, receitaSchema, categoriaSchema } from "@/lib/validators";

const validDespesa = {
  descricao: "Compra de luvas",
  valor: 50,
  data: "2026-03-15",
  categoriaId: "cat-1",
};

const validReceita = {
  descricao: "Consulta",
  valor: 300,
  data: "2026-03-15",
  categoriaId: "cat-1",
  formaPagamento: "PIX" as const,
};

describe("despesaSchema", () => {
  it("aceita payload válido completo", () => {
    const result = despesaSchema.safeParse({
      ...validDespesa,
      tipoGasto: "FIXO",
      fornecedor: "Fornecedor X",
      observacao: "Obs",
      recorrente: true,
    });
    expect(result.success).toBe(true);
  });

  it("aceita payload mínimo (só campos obrigatórios)", () => {
    const result = despesaSchema.safeParse(validDespesa);
    expect(result.success).toBe(true);
  });

  it("aplica default tipoGasto=VARIAVEL", () => {
    const result = despesaSchema.safeParse(validDespesa);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.tipoGasto).toBe("VARIAVEL");
  });

  it("aplica default recorrente=false", () => {
    const result = despesaSchema.safeParse(validDespesa);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.recorrente).toBe(false);
  });

  it("rejeita descrição vazia", () => {
    const result = despesaSchema.safeParse({ ...validDespesa, descricao: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain("Descrição obrigatória");
    }
  });

  it("rejeita valor zero", () => {
    const result = despesaSchema.safeParse({ ...validDespesa, valor: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain("Valor deve ser positivo");
    }
  });

  it("rejeita valor negativo", () => {
    const result = despesaSchema.safeParse({ ...validDespesa, valor: -10 });
    expect(result.success).toBe(false);
  });

  it("rejeita data vazia", () => {
    const result = despesaSchema.safeParse({ ...validDespesa, data: "" });
    expect(result.success).toBe(false);
  });

  it("rejeita categoriaId vazio", () => {
    const result = despesaSchema.safeParse({ ...validDespesa, categoriaId: "" });
    expect(result.success).toBe(false);
  });

  it("rejeita tipoGasto inválido", () => {
    const result = despesaSchema.safeParse({ ...validDespesa, tipoGasto: "OUTRO" });
    expect(result.success).toBe(false);
  });

  // Bug potencial (Bug 5): valor aceita 0.001 (3 casas decimais) mas banco é Decimal(10,2).
  // O Prisma arredonda silenciosamente. Documentado — não corrigi aqui.
});

describe("receitaSchema", () => {
  it("aceita payload válido com PIX", () => {
    const result = receitaSchema.safeParse(validReceita);
    expect(result.success).toBe(true);
  });

  it("aceita cada formaPagamento", () => {
    const formas = ["DINHEIRO", "PIX", "CARTAO_CREDITO", "CARTAO_DEBITO", "TRANSFERENCIA", "BOLETO", "CONVENIO"];
    for (const forma of formas) {
      const result = receitaSchema.safeParse({ ...validReceita, formaPagamento: forma });
      expect(result.success).toBe(true);
    }
  });

  it("rejeita formaPagamento inválida", () => {
    const result = receitaSchema.safeParse({ ...validReceita, formaPagamento: "CHEQUE" });
    expect(result.success).toBe(false);
  });

  it("campos opcionais podem ser omitidos", () => {
    const result = receitaSchema.safeParse(validReceita);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.paciente).toBeUndefined();
      expect(result.data.observacao).toBeUndefined();
    }
  });

  it("rejeita descrição vazia", () => {
    const result = receitaSchema.safeParse({ ...validReceita, descricao: "" });
    expect(result.success).toBe(false);
  });

  it("rejeita valor não positivo", () => {
    const result = receitaSchema.safeParse({ ...validReceita, valor: 0 });
    expect(result.success).toBe(false);
  });
});

describe("categoriaSchema", () => {
  it("aceita categoria tipo DESPESA", () => {
    const result = categoriaSchema.safeParse({ nome: "Material", tipo: "DESPESA" });
    expect(result.success).toBe(true);
  });

  it("aceita categoria tipo RECEITA", () => {
    const result = categoriaSchema.safeParse({ nome: "Consulta", tipo: "RECEITA" });
    expect(result.success).toBe(true);
  });

  it("rejeita tipo inválido", () => {
    const result = categoriaSchema.safeParse({ nome: "X", tipo: "OUTRO" });
    expect(result.success).toBe(false);
  });

  it("rejeita nome vazio", () => {
    const result = categoriaSchema.safeParse({ nome: "", tipo: "DESPESA" });
    expect(result.success).toBe(false);
  });

  it("campos opcionais icone e cor podem ser omitidos", () => {
    const result = categoriaSchema.safeParse({ nome: "Material", tipo: "DESPESA" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.icone).toBeUndefined();
      expect(result.data.cor).toBeUndefined();
    }
  });
});
