"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { receitaSchema, ReceitaInput } from "@/lib/validators";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const resolver = zodResolver(receitaSchema) as any;
import { toInputDate } from "@/lib/utils";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

interface Categoria {
  id: string;
  nome: string;
  icone?: string | null;
}

interface ReceitaFormProps {
  categorias: Categoria[];
  defaultValues?: Partial<ReceitaInput & { id: string }>;
  onSubmit: (data: ReceitaInput) => Promise<void>;
  loading?: boolean;
}

const formasPagamento = [
  { value: "PIX", label: "PIX" },
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "CARTAO_CREDITO", label: "Cartão de Crédito" },
  { value: "CARTAO_DEBITO", label: "Cartão de Débito" },
  { value: "TRANSFERENCIA", label: "Transferência" },
  { value: "BOLETO", label: "Boleto" },
  { value: "CONVENIO", label: "Convênio" },
];

export default function ReceitaForm({ categorias, defaultValues, onSubmit, loading }: ReceitaFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReceitaInput>({
    resolver,
    defaultValues: {
      descricao: defaultValues?.descricao ?? "",
      valor: defaultValues?.valor ?? undefined,
      data: defaultValues?.data ?? toInputDate(new Date()),
      categoriaId: defaultValues?.categoriaId ?? "",
      formaPagamento: defaultValues?.formaPagamento ?? "PIX",
      paciente: defaultValues?.paciente ?? "",
      observacao: defaultValues?.observacao ?? "",
    },
  });

  const catOptions = categorias.map((c) => ({
    value: c.id,
    label: `${c.icone ?? ""} ${c.nome}`.trim(),
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit as SubmitHandler<ReceitaInput>)} className="space-y-4">
      <Input
        label="Descrição"
        id="descricao"
        placeholder="Ex: Consulta de clareamento"
        error={errors.descricao?.message}
        {...register("descricao")}
      />

      <Input
        label="Valor (R$)"
        id="valor"
        type="number"
        step="0.01"
        min="0"
        inputMode="decimal"
        placeholder="0,00"
        error={errors.valor?.message}
        {...register("valor", { valueAsNumber: true })}
      />

      <Input
        label="Data"
        id="data"
        type="date"
        error={errors.data?.message}
        {...register("data")}
      />

      <Select
        label="Especialidade / Categoria"
        id="categoriaId"
        options={catOptions}
        placeholder="Selecione uma categoria"
        error={errors.categoriaId?.message}
        {...register("categoriaId")}
      />

      <Select
        label="Forma de Pagamento"
        id="formaPagamento"
        options={formasPagamento}
        error={errors.formaPagamento?.message}
        {...register("formaPagamento")}
      />

      <Input
        label="Paciente (opcional)"
        id="paciente"
        placeholder="Nome do paciente"
        {...register("paciente")}
      />

      <Input
        label="Observação (opcional)"
        id="observacao"
        placeholder="Observações adicionais"
        {...register("observacao")}
      />

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Salvando..." : "Salvar Receita"}
      </Button>
    </form>
  );
}
