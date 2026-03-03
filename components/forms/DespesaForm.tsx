"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { despesaSchema, DespesaInput } from "@/lib/validators";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const resolver = zodResolver(despesaSchema) as any;
import { toInputDate } from "@/lib/utils";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

interface Categoria {
  id: string;
  nome: string;
  icone?: string | null;
}

interface DespesaFormProps {
  categorias: Categoria[];
  defaultValues?: Partial<DespesaInput & { id: string }>;
  onSubmit: (data: DespesaInput) => Promise<void>;
  loading?: boolean;
}

export default function DespesaForm({ categorias, defaultValues, onSubmit, loading }: DespesaFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DespesaInput>({
    resolver,
    defaultValues: {
      descricao: defaultValues?.descricao ?? "",
      valor: defaultValues?.valor ?? undefined,
      data: defaultValues?.data ?? toInputDate(new Date()),
      categoriaId: defaultValues?.categoriaId ?? "",
      tipoGasto: defaultValues?.tipoGasto ?? "VARIAVEL",
      fornecedor: defaultValues?.fornecedor ?? "",
      observacao: defaultValues?.observacao ?? "",
      recorrente: defaultValues?.recorrente ?? false,
    },
  });

  const catOptions = categorias.map((c) => ({
    value: c.id,
    label: `${c.icone ?? ""} ${c.nome}`.trim(),
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit as SubmitHandler<DespesaInput>)} className="space-y-4">
      <Input
        label="Descrição"
        id="descricao"
        placeholder="Ex: Compra de luvas"
        error={errors.descricao?.message}
        {...register("descricao")}
      />

      <Input
        label="Valor (R$)"
        id="valor"
        inputMode="decimal"
        placeholder="0,00"
        error={errors.valor?.message}
        {...register("valor", { setValueAs: (v) => parseFloat(String(v).replace(",", ".")) })}
      />

      <Input
        label="Data"
        id="data"
        type="date"
        error={errors.data?.message}
        {...register("data")}
      />

      <Select
        label="Categoria"
        id="categoriaId"
        options={catOptions}
        placeholder="Selecione uma categoria"
        error={errors.categoriaId?.message}
        {...register("categoriaId")}
      />

      <Select
        label="Tipo de Gasto"
        id="tipoGasto"
        options={[
          { value: "VARIAVEL", label: "Variável" },
          { value: "FIXO", label: "Fixo" },
        ]}
        error={errors.tipoGasto?.message}
        {...register("tipoGasto")}
      />

      <Input
        label="Fornecedor (opcional)"
        id="fornecedor"
        placeholder="Nome do fornecedor"
        {...register("fornecedor")}
      />

      <Input
        label="Observação (opcional)"
        id="observacao"
        placeholder="Observações adicionais"
        {...register("observacao")}
      />

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" className="rounded" {...register("recorrente")} />
        <span className="text-sm text-gray-700">Despesa recorrente</span>
      </label>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Salvando..." : "Salvar Despesa"}
      </Button>
    </form>
  );
}
