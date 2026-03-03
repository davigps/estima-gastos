"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal, { ConfirmModal } from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import ReceitaForm from "@/components/forms/ReceitaForm";
import { ReceitaInput } from "@/lib/validators";

interface Categoria {
  id: string;
  nome: string;
  icone: string | null;
  cor: string | null;
}

interface Receita {
  id: string;
  descricao: string;
  valor: string;
  data: string;
  formaPagamento: string;
  paciente: string | null;
  categoria: Categoria;
}

const formaPagamentoLabel: Record<string, string> = {
  PIX: "PIX",
  DINHEIRO: "Dinheiro",
  CARTAO_CREDITO: "Cartão Crédito",
  CARTAO_DEBITO: "Cartão Débito",
  TRANSFERENCIA: "Transferência",
  BOLETO: "Boleto",
  CONVENIO: "Convênio",
};

export default function ReceitasPage() {
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Receita | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  async function loadData() {
    setLoading(true);
    const [rec, cats] = await Promise.all([
      fetch(`/api/receitas?year=${year}&month=${month}`).then((r) => r.json()),
      fetch("/api/categorias?tipo=RECEITA").then((r) => r.json()),
    ]);
    setReceitas(rec.receitas);
    setTotal(rec.total);
    setCategorias(cats.categorias);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [year, month]);

  async function handleSubmit(data: ReceitaInput) {
    setSaving(true);
    const url = editing ? `/api/receitas/${editing.id}` : "/api/receitas";
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
    await fetch(`/api/receitas/${deleting}`, { method: "DELETE" });
    setDeleteLoading(false);
    setDeleting(null);
    loadData();
  }

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  const totalValor = receitas.reduce((sum, r) => sum + Number(r.valor), 0);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 hidden md:block">Receitas</h1>
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
      ) : receitas.length === 0 ? (
        <EmptyState
          icon="💰"
          title="Nenhuma receita"
          description="Cadastre uma nova receita para este período."
          action={{ label: "Nova Receita", onClick: () => { setEditing(null); setShowForm(true); } }}
        />
      ) : (
        <>
          <div className="space-y-2">
            {receitas.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{r.descricao}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <Badge color={r.categoria.cor ?? undefined}>
                        {r.categoria.icone} {r.categoria.nome}
                      </Badge>
                      <Badge className="bg-teal-50 text-teal-700">
                        {formaPagamentoLabel[r.formaPagamento] ?? r.formaPagamento}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-400">{formatDate(r.data)}</p>
                      {r.paciente && (
                        <p className="text-xs text-gray-400">· {r.paciente}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-green-600">{formatCurrency(Number(r.valor))}</p>
                    <div className="flex gap-1.5 mt-2 justify-end">
                      <button
                        onClick={() => { setEditing(r); setShowForm(true); }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleting(r.id)}
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
            <span className="text-green-600">{formatCurrency(totalValor)}</span>
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
        title={editing ? "Editar Receita" : "Nova Receita"}
      >
        <ReceitaForm
          categorias={categorias}
          defaultValues={editing ? {
            descricao: editing.descricao,
            valor: Number(editing.valor),
            data: editing.data.split("T")[0],
            categoriaId: editing.categoria.id,
            formaPagamento: editing.formaPagamento as ReceitaInput["formaPagamento"],
            paciente: editing.paciente ?? undefined,
          } : undefined}
          onSubmit={handleSubmit}
          loading={saving}
        />
      </Modal>

      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Excluir Receita"
        message="Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita."
        loading={deleteLoading}
      />
    </div>
  );
}
