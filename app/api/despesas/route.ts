import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { despesaSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const categoriaId = searchParams.get("categoriaId");
  const tipoGasto = searchParams.get("tipoGasto") as "FIXO" | "VARIAVEL" | null;
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  const where: Record<string, unknown> = {};
  if (categoriaId) where.categoriaId = categoriaId;
  if (tipoGasto) where.tipoGasto = tipoGasto;
  if (year && month) {
    const start = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1));
    const end = new Date(Date.UTC(parseInt(year), parseInt(month), 0, 23, 59, 59, 999));
    where.data = { gte: start, lte: end };
  }

  const [despesas, total] = await Promise.all([
    prisma.despesa.findMany({
      where,
      include: { categoria: true },
      orderBy: { data: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.despesa.count({ where }),
  ]);

  return NextResponse.json({ despesas, total, page, limit });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = despesaSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: d } = parsed;
  const despesa = await prisma.despesa.create({
    data: {
      descricao: d.descricao,
      valor: d.valor,
      data: new Date(d.data),
      categoriaId: d.categoriaId,
      tipoGasto: d.tipoGasto,
      fornecedor: d.fornecedor,
      observacao: d.observacao,
      recorrente: d.recorrente,
    },
    include: { categoria: true },
  });

  return NextResponse.json(despesa, { status: 201 });
}
