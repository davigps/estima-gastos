import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DespesaForm from "@/components/forms/DespesaForm";
import { mockCategoriaDespesa } from "../../helpers/fixtures";

const categorias = [mockCategoriaDespesa];

const validInput = {
  descricao: "Compra de luvas",
  valor: 50,
  data: "2026-03-15",
  categoriaId: "cat-despesa-1",
  tipoGasto: "VARIAVEL" as const,
  recorrente: false,
};

describe("DespesaForm", () => {
  it("renderiza todos os campos do formulário", () => {
    render(<DespesaForm categorias={categorias} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/valor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/data/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/categoria/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tipo de gasto/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/despesa recorrente/i)).toBeInTheDocument();
  });

  it("botão fica desabilitado durante loading", () => {
    render(<DespesaForm categorias={categorias} onSubmit={vi.fn()} loading={true} />);
    const btn = screen.getByRole("button", { name: /salvando/i });
    expect(btn).toBeDisabled();
  });

  it("botão habilitado quando não está em loading", () => {
    render(<DespesaForm categorias={categorias} onSubmit={vi.fn()} loading={false} />);
    const btn = screen.getByRole("button", { name: /salvar despesa/i });
    expect(btn).not.toBeDisabled();
  });

  it("select de categorias mostra opções carregadas", () => {
    render(<DespesaForm categorias={categorias} onSubmit={vi.fn()} />);
    expect(screen.getByText(/material odontológico/i)).toBeInTheDocument();
  });

  it("modo edição: preenche campos com valores existentes", () => {
    render(
      <DespesaForm
        categorias={categorias}
        onSubmit={vi.fn()}
        defaultValues={{ ...validInput, id: "despesa-1" }}
      />,
    );

    expect(screen.getByDisplayValue("Compra de luvas")).toBeInTheDocument();
    expect(screen.getByDisplayValue("50")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-03-15")).toBeInTheDocument();
  });

  it("campos obrigatórios mostram erro ao submeter vazio", async () => {
    render(<DespesaForm categorias={categorias} onSubmit={vi.fn()} />);

    // Clear the description field and try to submit
    const descricaoField = screen.getByLabelText(/descrição/i);
    await userEvent.clear(descricaoField);

    const btn = screen.getByRole("button", { name: /salvar despesa/i });
    await userEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText("Descrição obrigatória")).toBeInTheDocument();
    });
  });

  it("submete com dados válidos e chama onSubmit", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<DespesaForm categorias={categorias} onSubmit={onSubmit} defaultValues={validInput} />);

    const btn = screen.getByRole("button", { name: /salvar despesa/i });
    await userEvent.click(btn);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const [calledWith] = onSubmit.mock.calls[0];
    expect(calledWith.descricao).toBe("Compra de luvas");
    expect(calledWith.valor).toBe(50);
  });

  it("checkbox recorrente funciona", async () => {
    render(<DespesaForm categorias={categorias} onSubmit={vi.fn()} />);
    const checkbox = screen.getByLabelText(/despesa recorrente/i);

    expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});
