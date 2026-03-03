import "dotenv/config";
import { PrismaClient, TipoLancamento } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  const categoriasDespesa = [
    { nome: "Pessoal", icone: "👤", cor: "#3B82F6" },
    { nome: "Materiais Clínicos", icone: "🏥", cor: "#10B981" },
    { nome: "Laboratório / Prótese", icone: "🦷", cor: "#8B5CF6" },
    { nome: "Aluguel e Infraestrutura", icone: "🏢", cor: "#F59E0B" },
    { nome: "Equipamentos", icone: "⚙️", cor: "#6B7280" },
    { nome: "Administrativo", icone: "📋", cor: "#EC4899" },
    { nome: "Marketing", icone: "📣", cor: "#EF4444" },
    { nome: "Impostos e Taxas", icone: "💰", cor: "#F97316" },
    { nome: "Seguros", icone: "🛡️", cor: "#14B8A6" },
    { nome: "Educação Continuada", icone: "📚", cor: "#6366F1" },
    { nome: "Utilidades", icone: "⚡", cor: "#FBBF24" },
    { nome: "Descarte de Resíduos", icone: "♻️", cor: "#22C55E" },
  ];

  const categoriasReceita = [
    { nome: "Clínica Geral", icone: "🦷", cor: "#3B82F6" },
    { nome: "Ortodontia", icone: "😁", cor: "#10B981" },
    { nome: "Implantodontia", icone: "🔩", cor: "#8B5CF6" },
    { nome: "Prótese Dentária", icone: "🦴", cor: "#F59E0B" },
    { nome: "Endodontia", icone: "🔬", cor: "#6B7280" },
    { nome: "Periodontia", icone: "🌿", cor: "#EC4899" },
    { nome: "Cirurgia", icone: "⚕️", cor: "#EF4444" },
    { nome: "Estética / Harmonização", icone: "✨", cor: "#F97316" },
    { nome: "Odontopediatria", icone: "👶", cor: "#14B8A6" },
    { nome: "Radiologia", icone: "📷", cor: "#6366F1" },
    { nome: "Outros", icone: "📦", cor: "#9CA3AF" },
  ];

  for (const cat of categoriasDespesa) {
    await prisma.categoria.upsert({
      where: { id: `despesa-${cat.nome.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: {
        id: `despesa-${cat.nome.toLowerCase().replace(/\s+/g, "-")}`,
        nome: cat.nome,
        tipo: TipoLancamento.DESPESA,
        icone: cat.icone,
        cor: cat.cor,
      },
    });
  }

  for (const cat of categoriasReceita) {
    await prisma.categoria.upsert({
      where: { id: `receita-${cat.nome.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: {
        id: `receita-${cat.nome.toLowerCase().replace(/\s+/g, "-")}`,
        nome: cat.nome,
        tipo: TipoLancamento.RECEITA,
        icone: cat.icone,
        cor: cat.cor,
      },
    });
  }

  console.log("Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
