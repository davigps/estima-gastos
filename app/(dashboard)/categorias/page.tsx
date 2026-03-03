"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categoriaSchema, CategoriaInput } from "@/lib/validators";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const catResolver = zodResolver(categoriaSchema) as any;

interface Categoria {
  id: string;
  nome: string;
  icone: string | null;
  cor: string | null;
  tipo: "DESPESA" | "RECEITA";
  ativa: boolean;
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"DESPESA" | "RECEITA">("DESPESA");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoriaInput>({
    resolver: catResolver,
    defaultValues: { tipo: "DESPESA" },
  });

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/categorias?ativas=false");
    const data = await res.json();
    setCategorias(data.categorias);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  function openCreate() {
    setEditing(null);
    reset({ nome: "", tipo: tab, icone: "", cor: "#3B82F6" });
    setShowForm(true);
  }

  function openEdit(cat: Categoria) {
    setEditing(cat);
    reset({ nome: cat.nome, tipo: cat.tipo, icone: cat.icone ?? "", cor: cat.cor ?? "#3B82F6" });
    setShowForm(true);
  }

  async function onSubmit(data: CategoriaInput) {
    setSaving(true);
    const url = editing ? `/api/categorias/${editing.id}` : "/api/categorias";
    const method = editing ? "PUT" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    setShowForm(false);
    loadData();
  }

  async function toggleAtiva(cat: Categoria) {
    if (cat.ativa) {
      await fetch(`/api/categorias/${cat.id}`, { method: "DELETE" });
    } else {
      await fetch(`/api/categorias/${cat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: cat.nome, tipo: cat.tipo, icone: cat.icone ?? undefined, cor: cat.cor ?? undefined, ativa: true }),
      });
    }
    loadData();
  }

  const filtered = categorias.filter((c) => c.tipo === tab);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 hidden md:block">Categorias</h1>
        <Button onClick={openCreate}>+ Nova Categoria</Button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white w-fit">
        {(["DESPESA", "RECEITA"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t === "DESPESA" ? "💸 Despesas" : "💰 Receitas"}
          </button>
        ))}
      </div>

      {loading ? (
        <ListSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🏷️"
          title="Nenhuma categoria"
          description="Adicione uma categoria para organizar seus lançamentos."
          action={{ label: "Nova Categoria", onClick: openCreate }}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((cat) => (
            <div
              key={cat.id}
              className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between ${!cat.ativa ? "opacity-50" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${cat.cor}20` }}
                >
                  {cat.icone ?? "📋"}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{cat.nome}</p>
                  {!cat.ativa && <p className="text-xs text-gray-400">Inativa</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(cat)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Editar
                </button>
                <button
                  onClick={() => toggleAtiva(cat)}
                  className={`text-xs hover:underline ${cat.ativa ? "text-orange-500" : "text-green-600"}`}
                >
                  {cat.ativa ? "Desativar" : "Reativar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? "Editar Categoria" : "Nova Categoria"}
      >
        <form onSubmit={handleSubmit(onSubmit as SubmitHandler<CategoriaInput>)} className="space-y-4">
          <Input
            label="Nome"
            id="nome"
            placeholder="Ex: Materiais Clínicos"
            error={errors.nome?.message}
            {...register("nome")}
          />
          <Select
            label="Tipo"
            id="tipo"
            options={[
              { value: "DESPESA", label: "Despesa" },
              { value: "RECEITA", label: "Receita" },
            ]}
            error={errors.tipo?.message}
            {...register("tipo")}
          />
          <Input
            label="Ícone (emoji)"
            id="icone"
            placeholder="Ex: 🦷"
            {...register("icone")}
          />
          <div className="space-y-1">
            <label htmlFor="cor" className="block text-sm font-medium text-gray-700">
              Cor
            </label>
            <input
              id="cor"
              type="color"
              className="w-12 h-10 rounded-xl border border-gray-200 cursor-pointer"
              {...register("cor")}
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
