import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1));

  const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  const startOfPrevMonth = new Date(Date.UTC(year, month - 2, 1));
  const endOfPrevMonth = new Date(Date.UTC(year, month - 1, 0, 23, 59, 59, 999));

  const [
    despesasMes,
    receitasMes,
    despesasMesAnterior,
    receitasMesAnterior,
    topCategorias,
    historicoMensal,
  ] = await Promise.all([
    prisma.despesa.aggregate({
      where: { data: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { valor: true },
    }),
    prisma.receita.aggregate({
      where: { data: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { valor: true },
    }),
    prisma.despesa.aggregate({
      where: { data: { gte: startOfPrevMonth, lte: endOfPrevMonth } },
      _sum: { valor: true },
    }),
    prisma.receita.aggregate({
      where: { data: { gte: startOfPrevMonth, lte: endOfPrevMonth } },
      _sum: { valor: true },
    }),
    prisma.despesa.groupBy({
      by: ["categoriaId"],
      where: { data: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { valor: true },
      orderBy: { _sum: { valor: "desc" } },
      take: 5,
    }),
    // Last 6 months
    Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const d = new Date(Date.UTC(year, month - 1 - i, 1));
        const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
        const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999));
        return Promise.all([
          prisma.despesa.aggregate({ where: { data: { gte: start, lte: end } }, _sum: { valor: true } }),
          prisma.receita.aggregate({ where: { data: { gte: start, lte: end } }, _sum: { valor: true } }),
        ]).then(([desp, rec]) => ({
          month: start.toISOString(),
          despesas: Number(desp._sum.valor ?? 0),
          receitas: Number(rec._sum.valor ?? 0),
        }));
      }),
    ),
  ]);

  // Fetch category details for top categories
  const categoriaIds = topCategorias.map((c) => c.categoriaId);
  const categorias = await prisma.categoria.findMany({ where: { id: { in: categoriaIds } } });
  const categoriaMap = Object.fromEntries(categorias.map((c) => [c.id, c]));

  const totalDespesas = Number(despesasMes._sum.valor ?? 0);
  const totalReceitas = Number(receitasMes._sum.valor ?? 0);
  const totalDespesasAnterior = Number(despesasMesAnterior._sum.valor ?? 0);
  const totalReceitasAnterior = Number(receitasMesAnterior._sum.valor ?? 0);

  return NextResponse.json({
    totalDespesas,
    totalReceitas,
    saldo: totalReceitas - totalDespesas,
    variacaoDespesas:
      totalDespesasAnterior > 0
        ? ((totalDespesas - totalDespesasAnterior) / totalDespesasAnterior) * 100
        : null,
    variacaoReceitas:
      totalReceitasAnterior > 0
        ? ((totalReceitas - totalReceitasAnterior) / totalReceitasAnterior) * 100
        : null,
    topCategorias: topCategorias.map((c) => ({
      categoriaId: c.categoriaId,
      nome: categoriaMap[c.categoriaId]?.nome ?? "—",
      icone: categoriaMap[c.categoriaId]?.icone ?? "",
      cor: categoriaMap[c.categoriaId]?.cor ?? "#6B7280",
      total: Number(c._sum.valor ?? 0),
      percentualReceita: totalReceitas > 0 ? (Number(c._sum.valor ?? 0) / totalReceitas) * 100 : 0,
    })),
    historico: historicoMensal.reverse(),
  });
}
