import { z } from "zod";

export const despesaSchema = z.object({
  descricao: z.string().min(1, "Descrição obrigatória"),
  valor: z.number().positive("Valor deve ser positivo"),
  data: z.string().min(1, "Data obrigatória"),
  categoriaId: z.string().min(1, "Categoria obrigatória"),
  tipoGasto: z.enum(["FIXO", "VARIAVEL"]).default("VARIAVEL"),
  fornecedor: z.string().optional(),
  observacao: z.string().optional(),
  recorrente: z.boolean().default(false),
});

export const receitaSchema = z.object({
  descricao: z.string().min(1, "Descrição obrigatória"),
  valor: z.number().positive("Valor deve ser positivo"),
  data: z.string().min(1, "Data obrigatória"),
  categoriaId: z.string().min(1, "Categoria obrigatória"),
  formaPagamento: z.enum([
    "DINHEIRO",
    "PIX",
    "CARTAO_CREDITO",
    "CARTAO_DEBITO",
    "TRANSFERENCIA",
    "BOLETO",
    "CONVENIO",
  ]),
  paciente: z.string().optional(),
  observacao: z.string().optional(),
});

export const categoriaSchema = z.object({
  nome: z.string().min(1, "Nome obrigatório"),
  tipo: z.enum(["DESPESA", "RECEITA"]),
  icone: z.string().optional(),
  cor: z.string().optional(),
});

export type DespesaInput = z.infer<typeof despesaSchema>;
export type ReceitaInput = z.infer<typeof receitaSchema>;
export type CategoriaInput = z.infer<typeof categoriaSchema>;
