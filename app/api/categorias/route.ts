import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { categoriaSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo") as "DESPESA" | "RECEITA" | null;
  const apenasAtivas = searchParams.get("ativas") !== "false";

  const where: Record<string, unknown> = {};
  if (tipo) where.tipo = tipo;
  if (apenasAtivas) where.ativa = true;

  const categorias = await prisma.categoria.findMany({
    where,
    orderBy: { nome: "asc" },
  });

  return NextResponse.json({ categorias });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = categoriaSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const categoria = await prisma.categoria.create({ data: parsed.data });
  return NextResponse.json(categoria, { status: 201 });
}
