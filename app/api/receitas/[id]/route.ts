import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { receitaSchema } from "@/lib/validators";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const parsed = receitaSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: d } = parsed;
  const receita = await prisma.receita.update({
    where: { id },
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

  return NextResponse.json(receita);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.receita.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
