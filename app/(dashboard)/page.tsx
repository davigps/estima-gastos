"use client";

import { useEffect, useState } from "react";
import ResumoCards from "@/components/dashboard/ResumoCards";
import GraficoMensal from "@/components/dashboard/GraficoMensal";
import TopCategorias from "@/components/dashboard/TopCategorias";
import { CardSkeleton } from "@/components/ui/Skeleton";

interface DashboardData {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  variacaoReceitas: number | null;
  variacaoDespesas: number | null;
  topCategorias: {
    categoriaId: string;
    nome: string;
    icone: string;
    cor: string;
    total: number;
    percentualReceita: number;
  }[];
  historico: { month: string; receitas: number; despesas: number }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [year, month]);

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 hidden md:block">Dashboard</h1>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {months.map((m, i) => (
              <option key={i + 1} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : data ? (
        <>
          <ResumoCards
            totalReceitas={data.totalReceitas}
            totalDespesas={data.totalDespesas}
            saldo={data.saldo}
            variacaoReceitas={data.variacaoReceitas}
            variacaoDespesas={data.variacaoDespesas}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <GraficoMensal data={data.historico} />
            <TopCategorias categorias={data.topCategorias} />
          </div>
        </>
      ) : null}
    </div>
  );
}
