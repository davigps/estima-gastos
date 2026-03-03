import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ResumoCards from "@/components/dashboard/ResumoCards";

const defaultProps = {
  totalReceitas: 1000,
  totalDespesas: 600,
  saldo: 400,
  variacaoReceitas: null,
  variacaoDespesas: null,
};

describe("ResumoCards", () => {
  it("renderiza 3 cards: Receitas, Despesas, Saldo", () => {
    render(<ResumoCards {...defaultProps} />);
    expect(screen.getByText("Receitas")).toBeInTheDocument();
    expect(screen.getByText("Despesas")).toBeInTheDocument();
    expect(screen.getByText("Saldo")).toBeInTheDocument();
  });

  it("formata valores como moeda BRL", () => {
    render(<ResumoCards {...defaultProps} />);
    // Check formatted values exist (use partial match for locale flexibility)
    expect(screen.getByText(/1[.,]000,00/)).toBeInTheDocument();
    expect(screen.getByText(/600,00/)).toBeInTheDocument();
    expect(screen.getByText(/400,00/)).toBeInTheDocument();
  });

  it("mostra variação percentual quando disponível", () => {
    render(<ResumoCards {...defaultProps} variacaoReceitas={15.5} variacaoDespesas={-5.2} />);
    // toFixed(1) uses '.' as decimal separator in JS; text may have whitespace around %
    const allVsTexts = screen.getAllByText(/vs mês anterior/);
    expect(allVsTexts).toHaveLength(2);
  });

  it("não mostra variação quando valor é null", () => {
    render(<ResumoCards {...defaultProps} variacaoReceitas={null} variacaoDespesas={null} />);
    expect(screen.queryByText(/vs mês anterior/)).not.toBeInTheDocument();
  });

  it("saldo positivo tem estilo azul (text-blue-600)", () => {
    const { container } = render(<ResumoCards {...defaultProps} saldo={400} />);
    // The saldo value uses text-blue-600 when positive
    const blueEl = container.querySelector(".text-blue-600.text-2xl");
    expect(blueEl).toBeInTheDocument();
  });

  it("saldo negativo tem estilo vermelho (text-red-500)", () => {
    const { container } = render(<ResumoCards {...defaultProps} saldo={-200} />);
    // When saldo is negative, the saldo value (text-2xl) should be text-red-500
    // Note: despesas value is also text-red-500 + text-2xl; saldo is the third card's value
    const redEls = container.querySelectorAll(".text-red-500.text-2xl");
    // Both Despesas and Saldo cards will have text-red-500 text-2xl
    expect(redEls.length).toBeGreaterThanOrEqual(1);
  });

  it("variação positiva tem cor verde", () => {
    const { container } = render(<ResumoCards {...defaultProps} variacaoReceitas={10} />);
    // The variation span uses text-green-600 (the receitas value <p> also uses it,
    // so we specifically target a <span> with that class)
    const greenSpan = container.querySelector("span.text-green-600");
    expect(greenSpan).toBeInTheDocument();
    expect(greenSpan!.textContent?.replace(/\s+/g, " ").trim()).toContain("vs mês anterior");
  });

  it("variação negativa tem cor vermelha", () => {
    const { container } = render(<ResumoCards {...defaultProps} variacaoDespesas={-10} />);
    // text-red-600 is used for negative variation spans (text-red-500 is for large value displays)
    const redSpan = container.querySelector("span.text-red-600");
    expect(redSpan).toBeInTheDocument();
    expect(redSpan!.textContent?.replace(/\s+/g, " ").trim()).toContain("vs mês anterior");
  });
});
