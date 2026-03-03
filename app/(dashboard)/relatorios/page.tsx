"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import Card from "@/components/ui/Card";
import { formatCurrency, formatMonth } from "@/lib/utils";
import { CardSkeleton } from "@/components/ui/Skeleton";

const BENCHMARKS: Record<string, number> = {
  Pessoal: 28,
  "Materiais Clínicos": 6,
  "Laboratório / Prótese": 5,
  "Aluguel e Infraestrutura": 10,
  Administrativo: 10,
  "Overhead total": 65,
};

const formaLabel: Record<string, string> = {
  PIX: "PIX", DINHEIRO: "Dinheiro", CARTAO_CREDITO: "C. Crédito",
  CARTAO_DEBITO: "C. Débito", TRANSFERENCIA: "Transferência",
  BOLETO: "Boleto", CONVENIO: "Convênio",
};

interface RelatorioData {
  dre: {
    totalReceitas: number;
    totalDespesasFixas: number;
    totalDespesasVariaveis: number;
    totalDespesas: number;
    resultado: number;
    percentualOverhead: number;
  };
  despesasPorCategoria: { id: string; nome: string; icone: string; cor: string; total: number; percentual: number }[];
  evolucao: { month: string; despesas: number; receitas: number; saldo: number }[];
  porFormaPagamento: { forma: string; total: number }[];
}

export default function RelatoriosPage() {
  const [data, setData] = useState<RelatorioData | null>(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [startMonth, setStartMonth] = useState(1);
  const [endMonth, setEndMonth] = useState(now.getMonth() + 1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/relatorios?year=${year}&startMonth=${startMonth}&endMonth=${endMonth}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [year, startMonth, endMonth]);

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-gray-900 hidden md:block">Relatórios</h1>
        <div className="flex flex-wrap gap-2">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {[now.getFullYear() - 1, now.getFullYear()].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={startMonth} onChange={(e) => setStartMonth(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <span className="self-center text-gray-400 text-sm">até</span>
          <select value={endMonth} onChange={(e) => setEndMonth(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : data ? (
        <>
          {/* DRE */}
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Resultado do Período (DRE)</h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-600">(+) Total de Receitas</span>
                <span className="font-medium text-green-600">{formatCurrency(data.dre.totalReceitas)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-600">(−) Despesas Fixas</span>
                <span className="font-medium text-red-500">{formatCurrency(data.dre.totalDespesasFixas)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-600">(−) Despesas Variáveis</span>
                <span className="font-medium text-red-500">{formatCurrency(data.dre.totalDespesasVariaveis)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600 font-medium">(−) Total Despesas</span>
                <div className="text-right">
                  <span className="font-semibold text-red-500">{formatCurrency(data.dre.totalDespesas)}</span>
                  {data.dre.totalReceitas > 0 && (
                    <span className={`ml-2 text-xs font-medium ${data.dre.percentualOverhead > 65 ? "text-red-500" : "text-green-600"}`}>
                      {data.dre.percentualOverhead.toFixed(1)}%{" "}
                      <span className="text-gray-400">(bench: 65%)</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between py-3">
                <span className="font-bold text-gray-900">(=) Resultado Operacional</span>
                <span className={`text-xl font-bold ${data.dre.resultado >= 0 ? "text-blue-600" : "text-red-500"}`}>
                  {formatCurrency(data.dre.resultado)}
                </span>
              </div>
            </div>
          </Card>

          {/* Benchmark indicators */}
          {data.despesasPorCategoria.length > 0 && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Indicadores vs Benchmark</h3>
              <div className="space-y-3">
                {data.despesasPorCategoria
                  .filter((c) => BENCHMARKS[c.nome])
                  .map((cat) => {
                    const bench = BENCHMARKS[cat.nome];
                    const excede = cat.percentual > bench;
                    return (
                      <div key={cat.id}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-700">{cat.icone} {cat.nome}</span>
                          <span className={`text-sm font-medium ${excede ? "text-red-500" : "text-green-600"}`}>
                            {cat.percentual.toFixed(1)}% <span className="text-gray-400 font-normal">(bench: {bench}%)</span>
                            {excede && " ⚠️"}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.min(cat.percentual / bench * 100, 100)}%`, backgroundColor: excede ? "#EF4444" : cat.cor }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Pie chart */}
            {data.despesasPorCategoria.length > 0 && (
              <Card>
                <h3 className="font-semibold text-gray-900 mb-4">Despesas por Categoria</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.despesasPorCategoria}
                      dataKey="total"
                      nameKey="nome"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                    >
                      {data.despesasPorCategoria.map((entry, index) => (
                        <Cell key={index} fill={entry.cor} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Forma de pagamento */}
            {data.porFormaPagamento.length > 0 && (
              <Card>
                <h3 className="font-semibold text-gray-900 mb-4">Receitas por Forma de Pagamento</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={data.porFormaPagamento.map((p) => ({ ...p, name: formaLabel[p.forma] ?? p.forma }))}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                    >
                      {data.porFormaPagamento.map((_, i) => (
                        <Cell key={i} fill={["#3B82F6","#10B981","#8B5CF6","#F59E0B","#EF4444","#EC4899","#14B8A6"][i % 7]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>

          {/* Bar chart receita vs despesa */}
          {data.evolucao.length > 1 && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Receita vs Despesa por Mês</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.evolucao.map((d) => ({ ...d, name: formatMonth(d.month) }))} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="receitas" name="Receitas" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Line chart saldo */}
          {data.evolucao.length > 1 && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">Evolução do Saldo</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.evolucao.map((d) => ({ ...d, name: formatMonth(d.month) }))} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}
