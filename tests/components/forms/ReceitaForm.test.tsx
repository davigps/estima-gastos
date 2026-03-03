import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReceitaForm from "@/components/forms/ReceitaForm";
import { mockCategoriaReceita } from "../../helpers/fixtures";

const categorias = [mockCategoriaReceita];

const validInput = {
  descricao: "Consulta de clareamento",
  valor: 300,
  data: "2026-03-15",
  categoriaId: "cat-receita-1",
  formaPagamento: "PIX" as const,
};

describe("ReceitaForm", () => {
  it("renderiza todos os campos do formulário", () => {
    render(<ReceitaForm categorias={categorias} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/valor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/data/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/especialidade/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/forma de pagamento/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/paciente/i)).toBeInTheDocument();
  });

  it("select de formaPagamento mostra todas as 7 opções", () => {
    render(<ReceitaForm categorias={categorias} onSubmit={vi.fn()} />);

    expect(screen.getByText("PIX")).toBeInTheDocument();
    expect(screen.getByText("Dinheiro")).toBeInTheDocument();
    expect(screen.getByText("Cartão de Crédito")).toBeInTheDocument();
    expect(screen.getByText("Cartão de Débito")).toBeInTheDocument();
    expect(screen.getByText("Transferência")).toBeInTheDocument();
    expect(screen.getByText("Boleto")).toBeInTheDocument();
    expect(screen.getByText("Convênio")).toBeInTheDocument();
  });

  it("campo paciente é opcional — não bloqueia submit", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ReceitaForm categorias={categorias} onSubmit={onSubmit} defaultValues={validInput} />);

    const btn = screen.getByRole("button", { name: /salvar receita/i });
    await userEvent.click(btn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  it("botão fica desabilitado durante loading", () => {
    render(<ReceitaForm categorias={categorias} onSubmit={vi.fn()} loading={true} />);
    const btn = screen.getByRole("button", { name: /salvando/i });
    expect(btn).toBeDisabled();
  });

  it("modo edição: preenche campos com valores existentes", () => {
    render(
      <ReceitaForm
        categorias={categorias}
        onSubmit={vi.fn()}
        defaultValues={{ ...validInput, id: "receita-1" }}
      />,
    );

    expect(screen.getByDisplayValue("Consulta de clareamento")).toBeInTheDocument();
    expect(screen.getByDisplayValue("300")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-03-15")).toBeInTheDocument();
  });

  it("campos obrigatórios mostram erro ao submeter vazio", async () => {
    render(<ReceitaForm categorias={categorias} onSubmit={vi.fn()} />);

    const descricaoField = screen.getByLabelText(/descrição/i);
    await userEvent.clear(descricaoField);

    const btn = screen.getByRole("button", { name: /salvar receita/i });
    await userEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText("Descrição obrigatória")).toBeInTheDocument();
    });
  });

  it("submete com dados válidos e chama onSubmit", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ReceitaForm categorias={categorias} onSubmit={onSubmit} defaultValues={validInput} />);

    const btn = screen.getByRole("button", { name: /salvar receita/i });
    await userEvent.click(btn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const [calledWith] = onSubmit.mock.calls[0];
    expect(calledWith.descricao).toBe("Consulta de clareamento");
    expect(calledWith.valor).toBe(300);
    expect(calledWith.formaPagamento).toBe("PIX");
  });
});
