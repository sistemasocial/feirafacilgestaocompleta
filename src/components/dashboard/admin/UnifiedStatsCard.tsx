import { Card } from "@/components/ui/card";
import { Calendar, Users, DollarSign } from "lucide-react";

interface UnifiedStatsCardProps {
  stats: {
    totalFeiras: number;
    feirasAtivas: number;
    totalFeirantes: number;
    participacoesConfirmadas: number;
    pagamentosPendentes: number;
    pagamentosRecebidos: number;
  };
}

export const UnifiedStatsCard = ({ stats }: UnifiedStatsCardProps) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6">Resumo do Sistema</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {/* Total de Feiras */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm">Total de Feiras</span>
          </div>
          <p className="text-3xl font-bold">{stats.totalFeiras}</p>
        </div>

        {/* Feiras Ativas */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm">Feiras Ativas</span>
          </div>
          <p className="text-3xl font-bold">{stats.feirasAtivas}</p>
        </div>

        {/* Feirantes Cadastrados */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm">Feirantes Cadastrados</span>
          </div>
          <p className="text-3xl font-bold">{stats.totalFeirantes}</p>
        </div>

        {/* Participações Confirmadas */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-sm">Participações Confirmadas</span>
          </div>
          <p className="text-3xl font-bold">{stats.participacoesConfirmadas}</p>
        </div>

        {/* Pagamentos Pendentes */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-sm">Pagamentos Pendentes</span>
          </div>
          <p className="text-2xl font-bold">
            R$ {stats.pagamentosPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Pagamentos Recebidos */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <span className="text-sm">Pagamentos Recebidos</span>
          </div>
          <p className="text-2xl font-bold">
            R$ {stats.pagamentosRecebidos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </Card>
  );
};
