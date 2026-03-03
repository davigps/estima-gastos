import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Modal, { ConfirmModal } from "@/components/ui/Modal";

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  title: "Test Modal",
  children: <p>Modal content</p>,
};

describe("Modal", () => {
  it("renderiza conteúdo quando open=true", () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("não renderiza quando open=false", () => {
    render(<Modal {...defaultProps} open={false} />);
    expect(screen.queryByText("Test Modal")).not.toBeInTheDocument();
    expect(screen.queryByText("Modal content")).not.toBeInTheDocument();
  });

  it("chama onClose ao clicar no overlay/backdrop", () => {
    const onClose = vi.fn();
    const { container } = render(<Modal {...defaultProps} onClose={onClose} />);

    // The backdrop is the absolute inset-0 div (first child of the outer div)
    const backdrop = container.querySelector(".absolute.inset-0");
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("chama onClose ao clicar no botão ×", () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);

    const closeBtn = screen.getByRole("button", { name: /×/ });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("chama onClose ao pressionar Escape", async () => {
    // BUG ENCONTRADO E CORRIGIDO: Modal não tinha handler de Escape.
    // Fix aplicado em: components/ui/Modal.tsx
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);

    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renderiza footer quando fornecido", () => {
    render(<Modal {...defaultProps} footer={<button>Ação</button>} />);
    expect(screen.getByText("Ação")).toBeInTheDocument();
  });
});

describe("ConfirmModal", () => {
  const confirmProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: "Confirmar Exclusão",
    message: "Tem certeza?",
  };

  it("botão confirmar (Excluir) chama onConfirm", () => {
    const onConfirm = vi.fn();
    render(<ConfirmModal {...confirmProps} onConfirm={onConfirm} />);

    const btn = screen.getByRole("button", { name: /excluir/i });
    fireEvent.click(btn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("botão Cancelar chama onClose", () => {
    const onClose = vi.fn();
    render(<ConfirmModal {...confirmProps} onClose={onClose} />);

    const btn = screen.getByRole("button", { name: /cancelar/i });
    fireEvent.click(btn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("exibe a mensagem passada", () => {
    render(<ConfirmModal {...confirmProps} />);
    expect(screen.getByText("Tem certeza?")).toBeInTheDocument();
  });

  it("botão Excluir fica desabilitado durante loading", () => {
    render(<ConfirmModal {...confirmProps} loading={true} />);
    const btn = screen.getByRole("button", { name: /excluindo/i });
    expect(btn).toBeDisabled();
  });
});
