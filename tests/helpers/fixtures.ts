export const mockCategoriaDespesa = {
  id: "cat-despesa-1",
  nome: "Material Odontológico",
  tipo: "DESPESA" as const,
  icone: "🦷",
  cor: "#EF4444",
  ativa: true,
  criadaEm: new Date("2026-01-01T00:00:00Z"),
};

export const mockCategoriaReceita = {
  id: "cat-receita-1",
  nome: "Consulta",
  tipo: "RECEITA" as const,
  icone: "💊",
  cor: "#10B981",
  ativa: true,
  criadaEm: new Date("2026-01-01T00:00:00Z"),
};

export const mockDespesa = {
  id: "despesa-1",
  descricao: "Compra de luvas",
  valor: 50,
  data: new Date("2026-03-15T00:00:00Z"),
  categoriaId: "cat-despesa-1",
  tipoGasto: "VARIAVEL" as const,
  fornecedor: null,
  observacao: null,
  recorrente: false,
  categoria: mockCategoriaDespesa,
  criadaEm: new Date("2026-03-15T00:00:00Z"),
};

export const mockReceita = {
  id: "receita-1",
  descricao: "Consulta de clareamento",
  valor: 300,
  data: new Date("2026-03-15T00:00:00Z"),
  categoriaId: "cat-receita-1",
  formaPagamento: "PIX" as const,
  paciente: "João Silva",
  observacao: null,
  categoria: mockCategoriaReceita,
  criadaEm: new Date("2026-03-15T00:00:00Z"),
};

export const validDespesaPayload = {
  descricao: "Compra de luvas",
  valor: 50,
  data: "2026-03-15",
  categoriaId: "cat-despesa-1",
  tipoGasto: "VARIAVEL" as const,
  recorrente: false,
};

export const validReceitaPayload = {
  descricao: "Consulta de clareamento",
  valor: 300,
  data: "2026-03-15",
  categoriaId: "cat-receita-1",
  formaPagamento: "PIX" as const,
};
