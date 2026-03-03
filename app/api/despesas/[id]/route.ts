import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { despesaSchema } from "@/lib/validators";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = despesaSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: d } = parsed;
  const despesa = await prisma.despesa.update({
    where: { id },
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

  return NextResponse.json(despesa);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.despesa.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
