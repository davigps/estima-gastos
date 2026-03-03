import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { receitaSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const categoriaId = searchParams.get("categoriaId");
  const formaPagamento = searchParams.get("formaPagamento");
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  const where: Record<string, unknown> = {};
  if (categoriaId) where.categoriaId = categoriaId;
  if (formaPagamento) where.formaPagamento = formaPagamento;
  if (year && month) {
    const start = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1));
    const end = new Date(Date.UTC(parseInt(year), parseInt(month), 0, 23, 59, 59, 999));
    where.data = { gte: start, lte: end };
  }

  const [receitas, total] = await Promise.all([
    prisma.receita.findMany({
      where,
      include: { categoria: true },
      orderBy: { data: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.receita.count({ where }),
  ]);

  return NextResponse.json({ receitas, total, page, limit });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = receitaSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: d } = parsed;
  const receita = await prisma.receita.create({
    data: {
      descricao: d.descricao,
      valor: d.valor,
      data: new Date(d.data),
      categoriaId: d.categoriaId,
      formaPagamento: d.formaPagamento,
      paciente: d.paciente,
      observacao: d.observacao,
    },
    include: { categoria: true },
  });

  return NextResponse.json(receita, { status: 201 });
}
