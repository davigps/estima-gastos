"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import DespesaForm from "@/components/forms/DespesaForm";
import { DespesaInput } from "@/lib/validators";

interface Categoria {
  id: string;
  nome: string;
  icone: string | null;
  cor: string | null;
}

interface Despesa {
  id: string;
  descricao: string;
  valor: string;
  data: string;
  tipoGasto: "FIXO" | "VARIAVEL";
  fornecedor: string | null;
  recorrente: boolean;
  categoria: Categoria;
}

export default function DespesasPage() {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Despesa | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  async function loadData() {
    setLoading(true);
    const [desp, cats] = await Promise.all([
      fetch(`/api/despesas?year=${year}&month=${month}`).then((r) => r.json()),
      fetch("/api/categorias?tipo=DESPESA").then((r) => r.json()),
    ]);
    setDespesas(desp.despesas);
    setTotal(desp.total);
    setCategorias(cats.categorias);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [year, month]);

  async function handleSubmit(data: DespesaInput) {
    setSaving(true);
    const url = editing ? `/api/despesas/${editing.id}` : "/api/despesas";
    const method = editing ? "PUT" : "POST";
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    setShowForm(false);
    setEditing(null);
    loadData();
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    await fetch(`/api/despesas/${deleting}`, { method: "DELETE" });
    setDeleteLoading(false);
    setDeleting(null);
    loadData();
  }

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  const totalValor = despesas.reduce((sum, d) => sum + Number(d.valor), 0);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 hidden md:block">Despesas</h1>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {months.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[now.getFullYear() - 1, now.getFullYear()].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button className="hidden md:flex" onClick={() => { setEditing(null); setShowForm(true); }}>
            + Nova
          </Button>
        </div>
      </div>

      {loading ? (
        <ListSkeleton />
      ) : despesas.length === 0 ? (
        <EmptyState
          icon="💸"
          title="Nenhuma despesa"
          description="Cadastre uma nova despesa para este período."
          action={{ label: "Nova Despesa", onClick: () => { setEditing(null); setShowForm(true); } }}
        />
      ) : (
        <>
          <div className="space-y-2">
            {despesas.map((d) => (
              <div
                key={d.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{d.descricao}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <Badge color={d.categoria.cor ?? undefined}>
                        {d.categoria.icone} {d.categoria.nome}
                      </Badge>
                      <Badge className="bg-gray-100 text-gray-600">
                        {d.tipoGasto === "FIXO" ? "Fixo" : "Variável"}
                      </Badge>
                      {d.recorrente && <Badge className="bg-purple-50 text-purple-600">Recorrente</Badge>}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(d.data)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-red-500">{formatCurrency(Number(d.valor))}</p>
                    <div className="flex gap-1.5 mt-2 justify-end">
                      <button
                        onClick={() => { setEditing(d); setShowForm(true); }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleting(d.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex justify-between font-semibold">
            <span className="text-gray-700">Total ({total} registros)</span>
            <span className="text-red-500">{formatCurrency(totalValor)}</span>
          </div>
        </>
      )}

      {/* FAB mobile */}
      <button
        onClick={() => { setEditing(null); setShowForm(true); }}
        className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg text-2xl flex items-center justify-center md:hidden z-30"
      >
        +
      </button>

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        title={editing ? "Editar Despesa" : "Nova Despesa"}
      >
        <DespesaForm
          categorias={categorias}
          defaultValues={editing ? {
            descricao: editing.descricao,
            valor: Number(editing.valor),
            data: editing.data.split("T")[0],
            categoriaId: editing.categoria.id,
            tipoGasto: editing.tipoGasto,
            fornecedor: editing.fornecedor ?? undefined,
            recorrente: editing.recorrente,
          } : undefined}
          onSubmit={handleSubmit}
          loading={saving}
        />
      </Modal>

      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Excluir Despesa"
        message="Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita."
        loading={deleteLoading}
      />
    </div>
  );
}
