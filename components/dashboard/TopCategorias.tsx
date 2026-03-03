import Card from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";

const BENCHMARKS: Record<string, number> = {
  Pessoal: 28,
  "Materiais Clínicos": 6,
  "Laboratório / Prótese": 5,
  "Aluguel e Infraestrutura": 10,
  Administrativo: 10,
};

interface Categoria {
  categoriaId: string;
  nome: string;
  icone: string;
  cor: string;
  total: number;
  percentualReceita: number;
}

export default function TopCategorias({ categorias }: { categorias: Categoria[] }) {
  return (
    <Card>
      <h3 className="font-semibold text-gray-900 mb-4">Top Categorias de Despesa</h3>
      <div className="space-y-3">
        {categorias.map((cat) => {
          const benchmark = BENCHMARKS[cat.nome];
          const excedeBenchmark = benchmark && cat.percentualReceita > benchmark;
          return (
            <div key={cat.categoriaId}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700 flex items-center gap-1.5">
                  <span>{cat.icone}</span>
                  {cat.nome}
                </span>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(cat.total)}
                  </span>
                  {benchmark && (
                    <span
                      className={`ml-2 text-xs font-medium ${
                        excedeBenchmark ? "text-red-500" : "text-green-600"
                      }`}
                    >
                      {cat.percentualReceita.toFixed(1)}%{" "}
                      <span className="text-gray-400">(bench: {benchmark}%)</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(cat.percentualReceita, 100)}%`,
                    backgroundColor: excedeBenchmark ? "#EF4444" : cat.cor,
                  }}
                />
              </div>
            </div>
          );
        })}
        {categorias.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Nenhuma despesa registrada</p>
        )}
      </div>
    </Card>
  );
}
