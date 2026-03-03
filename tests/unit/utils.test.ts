import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, formatMonth, toInputDate, cn } from "@/lib/utils";

describe("formatCurrency", () => {
  it("formata número inteiro", () => {
    expect(formatCurrency(1000)).toBe("R$\u00a01.000,00");
  });

  it("formata decimal", () => {
    expect(formatCurrency(1234.56)).toBe("R$\u00a01.234,56");
  });

  it("formata zero", () => {
    expect(formatCurrency(0)).toBe("R$\u00a00,00");
  });

  it("formata número negativo", () => {
    const result = formatCurrency(-500);
    expect(result).toContain("500,00");
    expect(result).toContain("-");
  });

  it("aceita string numérica", () => {
    expect(formatCurrency("1500.50")).toBe("R$\u00a01.500,50");
  });

  it("aceita objeto com .toNumber() (Prisma Decimal)", () => {
    expect(formatCurrency({ toNumber: () => 99.9 })).toBe("R$\u00a099,90");
  });
});

describe("formatDate", () => {
  it("formata Date object com Z", () => {
    const result = formatDate(new Date("2026-03-15T00:00:00Z"));
    expect(result).toBe("15/03/2026");
  });

  it("formata string ISO UTC", () => {
    const result = formatDate("2026-01-01T00:00:00Z");
    expect(result).toBe("01/01/2026");
  });

  it("é consistente com timeZone UTC", () => {
    // "2026-03-15" as full ISO string (UTC midnight) should always be 15/03/2026
    const result = formatDate("2026-03-15T00:00:00Z");
    expect(result).toBe("15/03/2026");
  });
});

describe("formatMonth", () => {
  it("formata mês/ano junho 2026", () => {
    const result = formatMonth("2026-06-01T00:00:00Z");
    expect(result.toLowerCase()).toContain("jun");
    expect(result).toContain("2026");
  });

  it("formata janeiro (limite inferior)", () => {
    const result = formatMonth("2026-01-01T00:00:00Z");
    expect(result.toLowerCase()).toContain("jan");
    expect(result).toContain("2026");
  });

  it("formata dezembro (limite superior)", () => {
    const result = formatMonth("2026-12-01T00:00:00Z");
    expect(result.toLowerCase()).toContain("dez");
    expect(result).toContain("2026");
  });
});

describe("toInputDate", () => {
  it("retorna formato YYYY-MM-DD a partir de Date UTC", () => {
    expect(toInputDate(new Date("2026-03-15T00:00:00Z"))).toBe("2026-03-15");
  });

  it("retorna formato YYYY-MM-DD a partir de string ISO", () => {
    expect(toInputDate("2026-01-01T00:00:00Z")).toBe("2026-01-01");
  });

  it("datas ao meio-dia UTC são sempre o dia correto", () => {
    // Noon UTC is unambiguous across all timezones
    expect(toInputDate(new Date("2026-03-15T12:00:00Z"))).toBe("2026-03-15");
  });

  // Bug potencial: new Date(2026, 2, 15) usa horário local.
  // Em timezone UTC+X, a data pode ser subtraída 1 dia no toISOString().
  // Em UTC-X, o dia permanece correto. Documentado como bug potencial em timezone UTC+.
});

describe("cn", () => {
  it("junta classes", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("filtra undefined", () => {
    expect(cn("a", undefined, "b")).toBe("a b");
  });

  it("filtra false", () => {
    expect(cn("a", false, "b")).toBe("a b");
  });

  it("filtra null", () => {
    expect(cn("a", null)).toBe("a");
  });

  it("sem argumentos retorna string vazia", () => {
    expect(cn()).toBe("");
  });
});
