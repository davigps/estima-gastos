import Card from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils";

interface ResumoCardsProps {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  variacaoReceitas: number | null;
  variacaoDespesas: number | null;
}

function Variacao({ value }: { value: number | null }) {
  if (value === null) return null;
  const positive = value >= 0;
  return (
    <span className={`text-xs font-medium ${positive ? "text-green-600" : "text-red-600"}`}>
      {positive ? "+" : ""}
      {value.toFixed(1)}% vs mês anterior
    </span>
  );
}

export default function ResumoCards({
  totalReceitas,
  totalDespesas,
  saldo,
  variacaoReceitas,
  variacaoDespesas,
}: ResumoCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Card>
        <p className="text-sm text-gray-500 mb-1">Receitas</p>
        <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceitas)}</p>
        <Variacao value={variacaoReceitas} />
      </Card>
      <Card>
        <p className="text-sm text-gray-500 mb-1">Despesas</p>
        <p className="text-2xl font-bold text-red-500">{formatCurrency(totalDespesas)}</p>
        <Variacao value={variacaoDespesas} />
      </Card>
      <Card>
        <p className="text-sm text-gray-500 mb-1">Saldo</p>
        <p className={`text-2xl font-bold ${saldo >= 0 ? "text-blue-600" : "text-red-500"}`}>
          {formatCurrency(saldo)}
        </p>
        <span className="text-xs text-gray-400">Receita − Despesa</span>
      </Card>
    </div>
  );
}
