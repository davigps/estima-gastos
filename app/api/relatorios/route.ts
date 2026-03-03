import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()));
  const startMonth = parseInt(searchParams.get("startMonth") ?? "1");
  const endMonth = parseInt(searchParams.get("endMonth") ?? String(now.getMonth() + 1));

  const start = new Date(Date.UTC(year, startMonth - 1, 1));
  const end = new Date(Date.UTC(year, endMonth, 0, 23, 59, 59, 999));

  const [despesas, receitas] = await Promise.all([
    prisma.despesa.findMany({
      where: { data: { gte: start, lte: end } },
      include: { categoria: true },
    }),
    prisma.receita.findMany({
      where: { data: { gte: start, lte: end } },
      include: { categoria: true },
    }),
  ]);

  // DRE summary
  const totalReceitas = receitas.reduce((s, r) => s + Number(r.valor), 0);
  const totalDespesasFixas = despesas
    .filter((d) => d.tipoGasto === "FIXO")
    .reduce((s, d) => s + Number(d.valor), 0);
  const totalDespesasVariaveis = despesas
    .filter((d) => d.tipoGasto === "VARIAVEL")
    .reduce((s, d) => s + Number(d.valor), 0);
  const totalDespesas = totalDespesasFixas + totalDespesasVariaveis;
  const resultado = totalReceitas - totalDespesas;

  // Distribution by category (expenses)
  const despesasPorCategoria: Record<string, { nome: string; icone: string; cor: string; total: number }> = {};
  for (const d of despesas) {
    const key = d.categoriaId;
    if (!despesasPorCategoria[key]) {
      despesasPorCategoria[key] = {
        nome: d.categoria.nome,
        icone: d.categoria.icone ?? "",
        cor: d.categoria.cor ?? "#6B7280",
        total: 0,
      };
    }
    despesasPorCategoria[key].total += Number(d.valor);
  }

  // Monthly evolution
  const months = endMonth - startMonth + 1;
  const evolucao = await Promise.all(
    Array.from({ length: months }, (_, i) => {
      const m = startMonth + i;
      const s = new Date(Date.UTC(year, m - 1, 1));
      const e = new Date(Date.UTC(year, m, 0, 23, 59, 59, 999));
      return Promise.all([
        prisma.despesa.aggregate({ where: { data: { gte: s, lte: e } }, _sum: { valor: true } }),
        prisma.receita.aggregate({ where: { data: { gte: s, lte: e } }, _sum: { valor: true } }),
      ]).then(([desp, rec]) => ({
        month: s.toISOString(),
        despesas: Number(desp._sum.valor ?? 0),
        receitas: Number(rec._sum.valor ?? 0),
        saldo: Number(rec._sum.valor ?? 0) - Number(desp._sum.valor ?? 0),
      }));
    }),
  );

  // Payment method breakdown
  const porFormaPagamento: Record<string, number> = {};
  for (const r of receitas) {
    porFormaPagamento[r.formaPagamento] = (porFormaPagamento[r.formaPagamento] ?? 0) + Number(r.valor);
  }

  return NextResponse.json({
    dre: {
      totalReceitas,
      totalDespesasFixas,
      totalDespesasVariaveis,
      totalDespesas,
      resultado,
      percentualOverhead: totalReceitas > 0 ? (totalDespesas / totalReceitas) * 100 : 0,
    },
    despesasPorCategoria: Object.entries(despesasPorCategoria)
      .map(([id, v]) => ({ id, ...v, percentual: totalReceitas > 0 ? (v.total / totalReceitas) * 100 : 0 }))
      .sort((a, b) => b.total - a.total),
    evolucao,
    porFormaPagamento: Object.entries(porFormaPagamento).map(([forma, total]) => ({ forma, total })),
  });
}
